const express = require('express');
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);
router.get('/', async (_req, res, next) => {
  try {
    const [s, v, o, pending] = await Promise.all([
      supabase.from('suppliers').select('id', {count:'exact', head:true}),
      supabase.from('vendors').select('id', {count:'exact', head:true}),
      supabase.from('purchase_orders').select('id', {count:'exact', head:true}),
      supabase.from('purchase_orders').select('id', {count:'exact', head:true}).in('status',['draft','pending'])
    ]);
    for (const result of [s,v,o,pending]) if (result.error) throw result.error;
    res.json({ stats:{ suppliers:s.count || 0, vendors:v.count || 0, orders:o.count || 0, pendingOrders:pending.count || 0 } });
  } catch (err) { next(err); }
});
module.exports = router;
