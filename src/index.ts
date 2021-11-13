import express from 'express';
import { createServer, IncomingMessage, Server } from 'http';
import { Server as WServer, WebSocket } from 'ws';
import { Mongoose, Schema } from 'mongoose';
import passport from 'passport';
import { Strategy } from 'passport-http-bearer';
import * as redis from 'redis';
import cors from 'cors';
import crypto from 'crypto';
import { URLSearchParams } from 'url';
import fs from 'fs';
import bcrypt from 'bcrypt';
const { simpleflake } = require('simpleflakes');
const generateAvatar = require("github-like-avatar-generator");

const app = express();
const goose = new Mongoose();
const publisher = redis.createClient();

goose.connect('mongodb://localhost:27017/harmony');

const messageSchema = new Schema({
    id: { type: Schema.Types.String, default: () => simpleflake().toString(), index: true },
    owner: Schema.Types.String,
    channel: Schema.Types.String,
    content: Schema.Types.Mixed,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
const MessageModel = goose.model('Message', messageSchema);

const channelSchema = new Schema({
    id: { type: Schema.Types.String, default: () => simpleflake().toString(), index: true },
    server: Schema.Types.String,
    name: Schema.Types.String,
});
const ChannelModel = goose.model('Channel', channelSchema);

const serverSchema = new Schema({
    id: { type: Schema.Types.String, default: () => simpleflake().toString(), index: true },
    owner: Schema.Types.String,
    name: Schema.Types.String,
    channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
});
const ServerModel = goose.model('Server', serverSchema);

const userSchema = new Schema({
    id: { type: Schema.Types.String, default: () => simpleflake().toString(), index: true },
    name: Schema.Types.String,
    email: Schema.Types.String,
    password: Schema.Types.String,
    servers: [{ type: Schema.Types.ObjectId, ref: 'Server' }],
    token: Schema.Types.String,
    guest: Schema.Types.Boolean,
});
const UserModel = goose.model('User', userSchema);

const emojiSchema = new Schema({
    id: { type: Schema.Types.String, default: () => simpleflake().toString(), index: true },
    name: Schema.Types.String,
});
const EmojiModel = goose.model('Emoji', emojiSchema);

passport.use(new Strategy(
    (token, cb) => {
        UserModel.findOne({ token: token }, (err: any, user: any) => {
            if (err) { return cb(err); }
            if (!user) { return cb(null, false); }
            return cb(null, user);
        });
    }
));

app.use(express.json());
app.use(express.urlencoded({ extended: true, inflate: true }));
app.use(cors({
    origin: '*',
}));
app.use(passport.initialize());
app.use(express.static('public'))

app.post('/channels/:channel/messages', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    // TODO: Check permissions for channel
    let newMessage = new MessageModel({
        owner: req.user.id,
        channel: req.params.channel,
        content: req.body.content,
    });

    newMessage.save().then((result: any) => {
        publisher.publish(`channel.${result.channel}`, JSON.stringify({ type: 'newMessage', data: result }));
        res.status(200).json(result);
    }).catch((error: any) => {
        res.status(500).json({ error: error });
    });
});

app.get('/channels/:channel', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    ChannelModel.findOne({ id: req.params.channel }).then((result) => {
        if (result !== null) {
            res.status(200).json({
                data: {
                    id: req.params.channel,
                    type: 'channel',
                    attributes: result,
                }
            });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    }).catch((error) => {
        res.status(500).json({ error: error });
    });
});

app.post('/servers/:server/channels', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    let newChannel = new ChannelModel({
        server: req.params.server,
        name: req.body.name,
    });

    newChannel.save().then((result: any) => {
        ServerModel.updateOne({ id: req.params.server }, { $push: { channels: [result._id] } }).then(() => {
            ServerModel.findOne({ id: req.params.server }).populate({ path: 'channels' }).then((server) => {
                if (server != null) {
                    publisher.publish(`server.${result.server}`, JSON.stringify({ type: 'serverUpdate', data: server }));
                }
            });
            res.status(200).json(result);
        }).catch((error) => {
            ChannelModel.deleteOne({ _id: result._id });
            res.status(500).json({ error: error });
        });
    }).catch((error: any) => {
        res.status(500).json({ error: error });
    });
});

app.get('/servers/:server', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    ServerModel.findOne({ id: req.params.server }).populate({ path: 'channels' }).then(async (result) => {
        let emojis = await EmojiModel.find({ server: req.params.server });
        if (result !== null) {
            res.status(200).json({
                data: {
                    id: req.params.server,
                    type: 'server',
                    attributes: {
                        ...result,
                        emojis: emojis
                    },
                },
            });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    }).catch((error: any) => {
        console.log(error);
        res.status(500).json({ error: error });
    });
});

app.post('/servers/:server/emojis', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    // Remove header
    let base64Image = req.body.file.split(';base64,').pop();
    let newEmoji = new EmojiModel({
        name: req.body.name,
    });
    newEmoji.save().then((result: any) => {
        fs.writeFile(`./public/emoji/${result.id}.png`, base64Image, { encoding: 'base64' }, function (err) {
            console.log('File created');
        });
        res.status(200).json(result);
    });
});

app.post('/join/:server', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    console.log(req.user);
    ServerModel.findOne({ id: req.params.server }).then((result) => {
        UserModel.updateOne({ id: req.user.id }, { $push: { servers: [result._id] } }).then(() => {
            res.status(200).json(result);
        }).catch((error) => {
            res.status(500).json({ error: error });
        });
    }).catch((error) => {
        res.status(500).json({ error: error });
    });
    /* membership.save().then((result: any) => {
        res.status(200).json(result);
    }).catch((error: any) => {
        console.log(error);
        res.status(500).json({ error: error });
    }); */
});

app.post('/users', (req: any, res: any) => {
    if (req.body.guest) {
        let user = new UserModel({
            name: req.body.name,
            password: bcrypt.hashSync(crypto.randomBytes(48).toString('hex'), 10),
            token: crypto.randomBytes(48).toString('hex'),
            guest: true,
        });
        user.save().then((result: any) => {
            let avatar = generateAvatar({
                blocks: 6, // must be multiple of two
                width: 100
            });
            console.log(avatar.base64);
            let base64Image = avatar.base64.split(';base64,').pop();
            fs.writeFile(`./public/avatar/${result.id}.svg`, base64Image, { encoding: 'base64' }, function (err) {
                console.log('File created');
            });
            res.status(200).json({
                name: result.name,
                token: result.token,
            });
        }).catch((error: any) => {
            console.log(error);
            res.status(500).json({ error: error });
        });
    } else {
        let user = new UserModel({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            token: crypto.randomBytes(48).toString('hex'),
        });
        user.save().then((result: any) => {
            let avatar = generateAvatar({
                blocks: 6, // must be multiple of two
                width: 100
            });
            console.log(avatar.base64);
            let base64Image = avatar.base64.split(';base64,').pop();
            fs.writeFile(`./public/avatar/${result.id}.svg`, base64Image, { encoding: 'base64' }, function (err) {
                console.log('File created');
            });
            res.status(200).json({
                name: result.name,
                token: result.token,
            });
        }).catch((error: any) => {
            console.log(error);
            res.status(500).json({ error: error });
        });
    }
});

app.get('/users/:user_id', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    UserModel.findOne({ id: req.params.user_id }).then((result) => {
        if (result !== null) {
            res.status(200).json({
                data: {
                    id: result.id,
                    type: 'user',
                    attributes: {
                        name: result.name,
                    },
                },
            });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    });
});

app.post('/token-auth', (req: any, res: any) => {
    if (req.body.guest) {
        UserModel.findOne({ name: req.body.name, token: req.body.token }).then((result) => {
            if (result !== null) {
                res.status(200).json({ token: result.token });
            } else {
                res.status(403).json({ error: 'Forbidden' });
            }
        }).catch((error) => {
            res.status(403).json({ error: 'Forbidden' });
        });
    } else {
        UserModel.findOne({ email: req.body.email }).then((result) => {
            if (result !== null) {
                if (bcrypt.compareSync(req.body.password, result.password)) {
                    res.status(200).json({ token: result.token });
                } else {
                    res.status(403).json({ error: 'Forbidden' });
                }
            } else {
                res.status(403).json({ error: 'Forbidden' });
            }
        }).catch((error) => {
            res.status(403).json({ error: 'Forbidden' });
        });
    }
});

app.post('/server', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    console.log(req.user);
    let server = new ServerModel({
        owner: req.user._id.toString(),
        name: req.body.name,
    });
    server.save().then((result: any) => {
        UserModel.updateOne({ _id: req.user._id }, { $push: { servers: result._id } }).then(() => {
            res.status(200).json(result);
        }).catch((error) => {
            ServerModel.deleteOne({ _id: result._id });
            res.status(500).json({ error: error });
        });
    }).catch((error: any) => {
        console.log(error);
        res.status(500).json({ error: error });
    });
});

const server: Server = createServer(app);

const wss = new WServer({
    server, verifyClient: (info, done,) => {
        let token = (new URLSearchParams(info.req.url?.split('/?')[1])).get('access_token');
        UserModel.findOne({ token }, (err: any, user: any) => {
            if (err) { return done(false, 500, err); }
            if (!user) { return done(false, 403, 'Forbidden'); }
            return done(true);
        });
    }
});

wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    //connection is up, let's add a simple simple event
    let subscriber = redis.createClient();
    let token = (new URLSearchParams(request.url?.split('/?')[1])).get('access_token');
    let channelSub: null | string = null;
    let serverSub: null | string = null;

    subscriber.on('message', (channel, message) => {
        let event = JSON.parse(message);
        ws.send(JSON.stringify({ event: event.type, content: event.data }));
    });

    ws.on('message', (message: Buffer) => {
        let data = JSON.parse(message.toString());
        switch (data.action) {
            case 'channel':
                if (channelSub != null) {
                    subscriber.unsubscribe(`channel.${channelSub}`);
                }
                subscriber.subscribe(`channel.${data.value}`);
                channelSub = data.value;
                // TODO: Replace by a api request
                MessageModel.find({ channel: data.value }).sort('-_id').limit(50).then((result) => {
                    ws.send(JSON.stringify({ event: 'messages', content: result.reverse() }));
                });
                break;
            case 'server':
                if (serverSub != null) {
                    subscriber.unsubscribe(`server.${serverSub}`);
                }
                subscriber.subscribe(`server.${data.value}`);
                serverSub = data.value;
                break;
            case 'getMe':
                UserModel.findOne({ token: token }).populate({ path: 'servers', populate: { path: 'channels' } }).then((result) => {
                    ws.send(JSON.stringify({ event: 'getMe', content: result }));
                });
                break;
        }
    });
});

//start our server
server.listen(process.env.PORT || 8080, () => {
    console.log(server.address());
});