import { Request, Response } from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { prisma } from "../configs/prisma.js";
import * as Sentry from "@sentry/node"

const clerkWebhooks = async (req: Request, res: Response) => {
  try {
    const evt: any = await verifyWebhook(req);

    // Getting data from webhook event
    const { data, type } = evt;

    switch (type) {
      // ✅ When user is created in Clerk
      case "user.created": {
        await prisma.user.create({
          data: {
            id: data.id,
            email: data?.email_addresses?.[0]?.email_address, // ✅ fixed
            name: `${data?.first_name || ""} ${data?.last_name || ""}`,
            image: data?.image_url,
          },
        });
        break;
      }

      // ✅ When user is deleted in Clerk
      case "user.deleted": {
        await prisma.user.delete({
          where: { id: data.id },
        });
        break;
      }

      // ✅ When payment is updated
      case "paymentAttempt.updated": {
        if (
          (data?.charge_type === "recurring" ||
            data?.charge_type === "checkout") &&
          data?.status === "paid"
        ) {
          const credits = {
            pro: 80,
            premium: 240,
          };

          const clerkUserId = data?.payer?.user_id;

          const planId = data?.subscription_items?.[0]?.plan?.slug as
            | "pro"
            | "premium"
            | undefined;

          if (!planId || !(planId in credits)) {
            return res.status(400).json({ message: "Invalid plan" });
          }

          await prisma.user.update({
            where: { id: clerkUserId },
            data: {
              credits: {
                increment: credits[planId],
              },
            },
          });
        }
        break;
      }

      default:
        break;
    }

    return res.status(200).json({
      message: "Webhook Received: " + type,
    });
  } catch (error: any) {
    Sentry.captureException(error)
    return res.status(500).json({
      message: error?.message || "Internal Server Error",
    });
  }
};

export default clerkWebhooks;
