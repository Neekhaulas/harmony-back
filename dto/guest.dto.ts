import { IsNotEmpty } from "class-validator";

export class GuestDto {
  @IsNotEmpty()
  username: string;
}
