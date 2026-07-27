import { ApiProperty } from '@nestjs/swagger';

export interface ResponseMetadata {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  [key: string]: any;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: true, description: "Indique si l'opération a réussi" })
  success: boolean;

  @ApiProperty({ example: 'Opération réussie avec succès', description: 'Message descriptif pour le client' })
  message: string;

  @ApiProperty({ description: 'Données utiles de la réponse' })
  data: T;

  @ApiProperty({ required: false, description: 'Métadonnées (pagination, etc.)' })
  meta?: ResponseMetadata;

  @ApiProperty({ example: '2026-07-25T18:30:00.000Z', description: "Horodatage de l'exécution" })
  timestamp: string;

  @ApiProperty({ example: 'req-uuid-1234-5678', description: 'Identifiant unique de traçabilité de la requête' })
  requestId: string;
}