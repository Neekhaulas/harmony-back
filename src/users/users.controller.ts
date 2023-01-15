import { Body, Controller, Get, HttpException, HttpStatus, Param, Post} from "@nestjs/common";
import { GuestDto } from "dto/guest.dto";
import { UserDto } from "dto/user.dto";
import { UsersService } from "./users.service";
import * as crypto from "crypto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get(":id")
  async get(@Param("id") id: string) {
    const user = await this.usersService.get(id);
    if (user === null) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    return {
      data: {
        id: user._id,
        type: "user",
        attributes: user,
      },
    };
  }

  @Post("guest")
  async createGuest(@Body() createGuestDto: GuestDto) {
    const password = crypto.randomBytes(48).toString("hex");
    const email = crypto.randomBytes(48).toString("hex");
    await this.usersService.createUser({
      ...createGuestDto,
      password,
      email,
    });
    return {
      email,
      password,
    };
  }
}
