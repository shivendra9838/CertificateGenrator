import { Router, Request, Response, NextFunction } from 'express';
import { connectToDatabase } from '../config/database';
import { databaseService } from '../services/DatabaseService';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificateId = typeof req.query.id === 'string' ? req.query.id.trim() : '';

    if (!certificateId) {
      return res.status(400).json({
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Certificate id query parameter is required',
        },
      });
    }

    await connectToDatabase();

    const certificate = await databaseService.getCertificateByUniqueId(certificateId);

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        data: null,
      });
    }

    return res.status(200).json({
      valid: true,
      data: {
        certId: certificate.uniqueCertificateId,
        recipientName: certificate.participantName,
        role: certificate.role,
        program: certificate.eventOrInternship,
        date: certificate.date,
        issuedAt: certificate.generatedAt,
        issuedBy: certificate.issuedBy,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
