import { User } from "./user";

function can(user: User, feature: string) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  return authorized;
}

const authorization = {
  can,
};

export default authorization;
