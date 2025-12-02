import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import * as z from "zod";

const bodySchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    message: z.string().min(10),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, message } = bodySchema.parse(body);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER,
            replyTo: email,
            subject: `New Feedback from Vitb Notes: ${name}`,
            text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `,
            html: `
<h3>New Feedback Received</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<br/>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, "<br>")}</p>
      `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error sending email:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}
