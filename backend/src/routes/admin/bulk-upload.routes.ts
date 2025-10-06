import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as bulkUploadController from '../../controllers/admin/bulk-upload.controller';
import multer from 'multer';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only Excel files
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
});

// Download Excel template
router.get('/template', authenticateToken, bulkUploadController.downloadTemplate);

// Upload and process Excel file
router.post(
  '/upload',
  authenticateToken,
  upload.single('file'),
  bulkUploadController.processBulkUpload
);

export default router;
