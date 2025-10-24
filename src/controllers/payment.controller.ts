import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Order } from "../entities/order.entity";
import { Payment, PaymentStatus } from "../entities/payment.entity";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { AuthorizeNetService } from "../services/authorize-net.service";
import { ProcessPaymentDto, RefundPaymentDto } from "../dto/payment.dto";

const orderRepository = AppDataSource.getRepository(Order);
const paymentRepository = AppDataSource.getRepository(Payment);

export const PaymentController = {
  processPayment: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;

      // Transform and validate DTO
      const processPaymentDto = plainToInstance(ProcessPaymentDto, req.body);
      const errors = await validate(processPaymentDto, {
        whitelist: true,
        forbidUnknownValues: true,
        validationError: { target: false },
      });

      if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
      }

      // Verify user owns the order
      const order = await orderRepository.findOne({
        where: { id: processPaymentDto.orderId, userId },
        relations: ["items"], // Load items to see the calculation
      });

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.paymentStatus === PaymentStatus.COMPLETED) {
        res.status(400).json({ message: "Order already paid" });
        return;
      }

      // Debug order details
      console.log(`Payment processing - Order ID: ${order.id}`);
      console.log(
        `Order total from DB: ${order.total} (type: ${typeof order.total})`
      );
      console.log(
        `Order subtotal: ${order.subtotal} (type: ${typeof order.subtotal})`
      );
      console.log(`Order tax: ${order.tax} (type: ${typeof order.tax})`);
      console.log(
        `Order shipping: ${order.shipping} (type: ${typeof order.shipping})`
      );
      console.log(`Order items count: ${order.items?.length || 0}`);

      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          console.log(
            `Item ${index}: price=${item.price}, quantity=${item.quantity}, total=${item.total}`
          );
        });
      }

      // Process payment - ensure amount is properly converted to number
      const orderTotal =
        typeof order.total === "string" ? parseFloat(order.total) : order.total;

      if (isNaN(orderTotal) || orderTotal <= 0) {
        res.status(400).json({
          message: "Invalid order total",
          orderTotal: order.total,
        });
        return;
      }

      const payment = await AuthorizeNetService.createTransaction(
        processPaymentDto.orderId,
        {
          cardNumber: processPaymentDto.cardNumber,
          expirationDate: processPaymentDto.expirationDate,
          cardCode: processPaymentDto.cardCode,
          amount: orderTotal,
        }
      );

      // Check if payment was successful
      const isSuccess = payment.status === "completed";

      res.status(isSuccess ? 200 : 400).json({
        success: isSuccess,
        payment,
        message: isSuccess
          ? "Payment processed successfully"
          : "Payment processing failed",
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({
        message: "Payment processing failed",
        error: error.message,
      });
    }
  },

  getPaymentStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const payment = await paymentRepository.findOne({
        where: { orderId },
        relations: ["order"],
      });

      if (!payment || payment.order.userId !== userId) {
        res.status(404).json({ message: "Payment not found" });
        return;
      }

      res.status(200).json(payment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  refundPayment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;

      // Transform and validate DTO
      const refundDto = plainToInstance(RefundPaymentDto, req.body);
      const errors = await validate(refundDto, {
        whitelist: true,
        forbidUnknownValues: true,
        validationError: { target: false },
      });

      if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
      }

      const payment = await paymentRepository.findOne({
        where: { id: paymentId },
        relations: ["order"],
      });

      if (!payment) {
        res.status(404).json({ message: "Payment not found" });
        return;
      }

      // Check if user owns the payment or is admin
      if (payment.order.userId !== req.user.id && req.user.userRole !== "su") {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const refundedPayment = await AuthorizeNetService.refundTransaction(
        paymentId,
        refundDto.amount
      );

      res.status(200).json({
        success: true,
        payment: refundedPayment,
        message: "Refund processed successfully",
      });
    } catch (error) {
      console.error("Refund error:", error);
      res.status(500).json({
        message: "Refund failed",
        error: error.message,
      });
    }
  },

  getTransactionDetails: async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;

      const transactionDetails =
        await AuthorizeNetService.getTransactionDetails(transactionId);

      res.status(200).json(transactionDetails);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
