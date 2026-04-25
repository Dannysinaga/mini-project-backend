import { Router } from "express";
import {
  createTransaction,
  getTransactionHistory,
  uploadPaymentProof,
  getPendingTransactions,
  approveTransaction,
  rejectTransaction,
} from "../controllers/transaction.controller";

const router = Router();

router.post("/", createTransaction);
router.get("/", getTransactionHistory);

router.patch("/:id/upload-proof", uploadPaymentProof);
router.get("/pending/list", getPendingTransactions);
router.patch("/:id/approve", approveTransaction);
router.patch("/:id/reject", rejectTransaction);

export default router;