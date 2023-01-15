import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserDto } from "dto/user.dto";
import { Model } from "mongoose";
import { User, UserDocument } from "schemas/user.schema";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
  ) { }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email });
  }

  async get(userId: string): Promise<User> {
    return this.userModel.findOne({ _id: userId });
  }

  async createUser(createUserDto: UserDto): Promise<User> {
    createUserDto.password = bcrypt.hashSync(createUserDto.password, 10);
    return await this.userModel.create(createUserDto);
  }
}
