import controller from "infra/controller";
import { ValidationError } from "infra/errors/errors";
import activation, { ActivationTokenResponse } from "models/activation";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

type ActivationsResponse = ActivationTokenResponse;

const router = createRouter<
  NextApiRequest,
  NextApiResponse<ActivationsResponse>
>();

export default router.handler(controller.errorHandlers);

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

async function patchHandler(
  req: NextApiRequest,
  res: NextApiResponse<ActivationsResponse>,
) {
  const activationTokenId = req.query.token_id;
  if (
    !activationTokenId ||
    activationTokenId === "undefined" ||
    typeof activationTokenId != "string"
  ) {
    throw new ValidationError({
      message: "Invalid activation token parameter",
    });
  }
  const validActivationToken =
    await activation.getValidAtivationToken(activationTokenId);

  await activation.activateUserByUserId(validActivationToken.user_id);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenId);

  return res.status(200).json(activation.toResponse(usedActivationToken));
}
