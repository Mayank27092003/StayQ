import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminExportService } from './admin-export.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('Admin / Export & Migration')
@UseGuards(FirebaseAuthGuard, AdminGuard)
@Controller('admin/export')
export class AdminExportController {
  constructor(private readonly exportService: AdminExportService) {}

  /**
   * Get total database stats
   * GET /api/v1/admin/export/stats
   */
  @Get('stats')
  async getStats() {
    return this.exportService.getStats();
  }

  /**
   * Universal 1-Click Database Export Bundle
   * GET /api/v1/admin/export/all
   */
  @Get('all')
  async exportAll() {
    return this.exportService.exportAll();
  }

  /**
   * Export single table
   * GET /api/v1/admin/export/table/:name
   */
  @Get('table/:name')
  async exportTable(@Param('name') name: string) {
    return this.exportService.exportTable(name);
  }

  /**
   * Download single table as CSV formatted stream
   * GET /api/v1/admin/export/table/:name/csv
   */
  @Get('table/:name/csv')
  async downloadCsv(@Param('name') name: string, @Res() res: Response) {
    const data = await this.exportService.exportTable(name);
    const rows = data.rows;
    if (!rows || rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=stayq_${name}_export.csv`,
      );
      return res.send('id,createdAt\n');
    }

    const headers = Object.keys(rows[0]).filter(
      (k) => typeof rows[0][k] !== 'object',
    );
    let csvContent = headers.join(',') + '\n';

    for (const row of rows) {
      const line = headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          let str = String(val);
          // CSV Formula Injection mitigation (=, +, -, @, tab, cr)
          if (/^[=\+\-@\t\r]/.test(str)) {
            str = `'${str}`;
          }
          str = str.replace(/"/g, '""');
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            str = `"${str}"`;
          }
          return str;
        })
        .join(',');
      csvContent += line + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=stayq_${name}_${Date.now()}.csv`,
    );
    return res.send(csvContent);
  }
}
