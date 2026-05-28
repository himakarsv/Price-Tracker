import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async sendPriceAlert(product: any): Promise<void> {
    try {
      const user = await this.usersService.findById(product.userId.toString());
      if (!user) {
        this.logger.warn(
          `Cannot send price alert: user ${product.userId} not found`,
        );
        return;
      }

      await this.mailerService.sendMail({
        to: user.email,
        subject: `Price Drop Alert: ${product.productName} is now ${product.currency} ${product.currentPrice}`,
        template: 'price-alert',
        context: {
          productName: product.productName,
          currentPrice: product.currentPrice.toLocaleString('en-IN'),
          desiredPrice: product.desiredPrice.toLocaleString('en-IN'),
          productUrl: product.url,
          productImage: product.productImage || '',
          currency: product.currency || '₹',
          userName: user.name,
        },
      });

      this.logger.log(
        `Price alert email sent to ${user.email} for product ${product.productName}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send price alert email: ${message}`);
    }
  }

  async sendWelcomeEmail(user: {
    email: string;
    name: string;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Price Tracker',
        template: 'welcome',
        context: {
          userName: user.name,
          dashboardUrl: process.env.FRONTEND_URL + '/dashboard',
        },
      });

      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send welcome email: ${message}`);
    }
  }
}
