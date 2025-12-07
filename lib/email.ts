import nodemailer from 'nodemailer';

// Email configuration - uses environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        // Check if email is configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            console.warn('Email not configured: SMTP_USER or SMTP_PASSWORD missing');
            return false;
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.to}`);
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

interface BookingEmailData {
    userName: string;
    userEmail: string;
    carMake: string;
    carModel: string;
    carYear: number;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    bookingId: string;
    status: string;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<boolean> {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚗 Booking Confirmation</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Drive-Ease Car Rental</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hello <strong>${data.userName}</strong>,</p>
        
        <p>Your booking has been <strong style="color: #22c55e;">${data.status === 'confirmed' ? 'confirmed' : 'received'}</strong>! Here are your booking details:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 15px; color: #667eea;">Vehicle Details</h3>
          <p style="margin: 5px 0;"><strong>Car:</strong> ${data.carYear} ${data.carMake} ${data.carModel}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #764ba2;">
          <h3 style="margin: 0 0 15px; color: #764ba2;">Rental Period</h3>
          <p style="margin: 5px 0;"><strong>Pick-up:</strong> ${formatDate(data.startDate)}</p>
          <p style="margin: 5px 0;"><strong>Return:</strong> ${formatDate(data.endDate)}</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: white; margin: 0; font-size: 14px;">Total Amount</p>
          <p style="color: white; margin: 5px 0 0; font-size: 32px; font-weight: bold;">₱${data.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 12px;">Payment: Face to Face upon pickup</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;"><strong>📋 Booking ID:</strong> ${data.bookingId}</p>
        </div>
        
        <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact us.</p>
        
        <p style="margin-top: 20px;">
          Best regards,<br>
          <strong>The Drive-Ease Team</strong>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Drive-Ease Car Rental. All rights reserved.</p>
        <p>This email was sent to ${data.userEmail}</p>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: data.userEmail,
        subject: `Booking ${data.status === 'confirmed' ? 'Confirmed' : 'Received'} - ${data.carYear} ${data.carMake} ${data.carModel}`,
        html,
    });
}

export async function sendBookingStatusUpdateEmail(data: BookingEmailData): Promise<boolean> {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const statusColors: Record<string, string> = {
        pending: '#f59e0b',
        confirmed: '#22c55e',
        completed: '#3b82f6',
        cancelled: '#ef4444',
    };

    const statusMessages: Record<string, string> = {
        pending: 'is pending confirmation',
        confirmed: 'has been confirmed',
        completed: 'has been completed',
        cancelled: 'has been cancelled',
    };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Status Update</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${statusColors[data.status] || '#667eea'}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📬 Booking Update</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Drive-Ease Car Rental</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hello <strong>${data.userName}</strong>,</p>
        
        <p>Your booking for <strong>${data.carYear} ${data.carMake} ${data.carModel}</strong> ${statusMessages[data.status] || 'has been updated'}.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #666;">Status</p>
          <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: ${statusColors[data.status] || '#667eea'}; text-transform: uppercase;">${data.status}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px; color: #333;">Booking Details</h3>
          <p style="margin: 5px 0;"><strong>Car:</strong> ${data.carYear} ${data.carMake} ${data.carModel}</p>
          <p style="margin: 5px 0;"><strong>Pick-up:</strong> ${formatDate(data.startDate)}</p>
          <p style="margin: 5px 0;"><strong>Return:</strong> ${formatDate(data.endDate)}</p>
          <p style="margin: 5px 0;"><strong>Total:</strong> ₱${data.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${data.bookingId}</p>
        </div>
        
        ${data.status === 'confirmed' ? `
        <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
          <p style="margin: 0; color: #166534;"><strong>✅ Your vehicle is ready!</strong> Please bring your valid driver's license and the booking confirmation when picking up the vehicle.</p>
        </div>
        ` : ''}
        
        ${data.status === 'cancelled' ? `
        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0; color: #991b1b;"><strong>❌ Booking Cancelled:</strong> If you did not request this cancellation or have any questions, please contact us immediately.</p>
        </div>
        ` : ''}
        
        <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact us.</p>
        
        <p style="margin-top: 20px;">
          Best regards,<br>
          <strong>The Drive-Ease Team</strong>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Drive-Ease Car Rental. All rights reserved.</p>
        <p>This email was sent to ${data.userEmail}</p>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: data.userEmail,
        subject: `Booking ${data.status.charAt(0).toUpperCase() + data.status.slice(1)} - ${data.carYear} ${data.carMake} ${data.carModel}`,
        html,
    });
}
