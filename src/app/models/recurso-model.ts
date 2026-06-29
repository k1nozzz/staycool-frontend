export interface RecursoDTO {
  id?: number;
  title: string;
  description: string;
  category: string;
  url?: string;
  imageUrl?: string;
  durationMinutes?: number;
  uploadedById?: number;
}
