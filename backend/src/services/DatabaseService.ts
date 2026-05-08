import { Certificate, ICertificate } from '../models/Certificate';
import { FilterQuery } from 'mongoose';

export interface CertificateRecord {
  participantName: string;
  role: string;
  eventOrInternship: string;
  date: Date;
  uniqueCertificateId: string;
  format: 'pdf' | 'image' | 'both';
  filePaths: {
    pdf?: string;
    image?: string;
  };
  issuedBy?: string;
  generatedAt?: Date;
}

export interface SearchQuery {
  searchTerm?: string;
  searchField?: 'name' | 'id';
  page: number;
  limit: number;
}

export interface SearchResult {
  certificates: ICertificate[];
  totalCount: number;
}

export class DatabaseService {
  async createCertificate(record: CertificateRecord): Promise<ICertificate> {
    try {
      const certificate = new Certificate({
        participantName: record.participantName,
        role: record.role,
        eventOrInternship: record.eventOrInternship,
        date: record.date,
        uniqueCertificateId: record.uniqueCertificateId,
        format: record.format,
        filePaths: record.filePaths,
        issuedBy: record.issuedBy || 'Head HR',
        generatedAt: record.generatedAt || new Date(),
      });

      const savedCertificate = await certificate.save();
      console.log(`Certificate created successfully: ${savedCertificate.uniqueCertificateId}`);

      return savedCertificate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create certificate:', errorMessage, {
        uniqueCertificateId: record.uniqueCertificateId,
        participantName: record.participantName,
      });
      throw new Error(`Database operation failed: ${errorMessage}`);
    }
  }

  async getCertificateById(id: string): Promise<ICertificate | null> {
    try {
      const certificate = await Certificate.findById(id);

      if (!certificate) {
        console.log(`Certificate not found with ID: ${id}`);
        return null;
      }

      return certificate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to retrieve certificate by ID:', errorMessage, { id });
      throw new Error(`Database operation failed: ${errorMessage}`);
    }
  }

  async getCertificateByUniqueId(uniqueId: string): Promise<ICertificate | null> {
    try {
      const certificate = await Certificate.findOne({ uniqueCertificateId: uniqueId });

      if (!certificate) {
        console.log(`Certificate not found with unique ID: ${uniqueId}`);
        return null;
      }

      return certificate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to retrieve certificate by unique ID:', errorMessage, { uniqueId });
      throw new Error(`Database operation failed: ${errorMessage}`);
    }
  }

  async deleteCertificateById(id: string): Promise<ICertificate | null> {
    try {
      const certificate = await Certificate.findByIdAndDelete(id);

      if (!certificate) {
        console.log(`Certificate not found for deletion with ID: ${id}`);
        return null;
      }

      console.log(`Certificate deleted successfully: ${certificate.uniqueCertificateId}`);
      return certificate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to delete certificate by ID:', errorMessage, { id });
      throw new Error(`Database operation failed: ${errorMessage}`);
    }
  }

  async searchCertificates(query: SearchQuery): Promise<SearchResult> {
    try {
      const { searchTerm, searchField, page, limit } = query;
      const skip = (page - 1) * limit;

      const filter: FilterQuery<ICertificate> = {};

      if (searchTerm && searchField) {
        if (searchField === 'name') {
          filter.$text = { $search: searchTerm };
        } else if (searchField === 'id') {
          filter.uniqueCertificateId = { $regex: searchTerm, $options: 'i' };
        }
      }

      const [certificates, totalCount] = await Promise.all([
        Certificate.find(filter).sort({ generatedAt: -1 }).skip(skip).limit(limit),
        Certificate.countDocuments(filter),
      ]);

      console.log(`Search completed: found ${totalCount} certificates, returning page ${page}`);

      return {
        certificates,
        totalCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to search certificates:', errorMessage, {
        searchTerm: query.searchTerm,
        searchField: query.searchField,
        page: query.page,
      });
      throw new Error(`Database operation failed: ${errorMessage}`);
    }
  }
}

export const databaseService = new DatabaseService();
