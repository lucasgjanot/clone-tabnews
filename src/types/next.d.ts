/* eslint-disable no-unused-vars */

import { User } from "models/user"; // ajuste o path

declare module "next" {
  interface NextApiRequest {
    context: {
      user: Partial<User>;
    };
  }
}
