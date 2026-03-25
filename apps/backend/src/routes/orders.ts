import { Router } from 'express';
import { orderService } from '../services/order.service.js';
import { containerService } from '../services/container.service.js';

export const ordersRouter = Router();

// List all orders
ordersRouter.get('/', async (_req, res) => {
  try {
    const orders = await orderService.list();
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create order
ordersRouter.post('/', async (req, res) => {
  try {
    const { order_number, purchase_channel, buyer_name, buyer_contact, duration_days, notes } = req.body;
    if (!order_number || !buyer_name) {
      res.status(400).json({ success: false, error: 'order_number and buyer_name are required' });
      return;
    }
    const order = await orderService.create({
      order_number,
      purchase_channel: purchase_channel || 'custom',
      buyer_name,
      buyer_contact,
      duration_days: duration_days || 30,
      notes,
    });
    res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update order
ordersRouter.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await orderService.update(id, req.body);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete order (only pending)
ordersRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await orderService.delete(id);
    if (!deleted) {
      res.status(400).json({ success: false, error: 'Cannot delete order (not found or not pending)' });
      return;
    }
    res.json({ success: true, message: 'Order deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Deliver order - create TS3 container
ordersRouter.post('/:id/deliver', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const container = await containerService.deliver(id);
    res.status(201).json({ success: true, data: container });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
