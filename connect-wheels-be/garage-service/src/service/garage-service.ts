import { DeepPartial } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Garage } from '../entity/garage';
import { GarageDTO, GarageUpdateDTO } from '../dtos/garage-dto';

export const createGarage = async (garageData: GarageDTO) => {
  const garageRepo = AppDataSource.getRepository(Garage);
  const toSave: DeepPartial<Garage> = {
    name: garageData.name,
    ownerId: garageData.ownerId,
    description: garageData.description ?? undefined,
    pictureUrl: garageData.pictureUrl ?? undefined,
    coverImageUrl: garageData.coverImageUrl ?? undefined,
    location: garageData.location ?? undefined,
  };
  const garage = await garageRepo.save(toSave);
  return { message: 'Garage created successfully', garageID: garage.id, garage };
};

export const getGarageById = async (garageId: number) => {
  const garageRepo = AppDataSource.getRepository(Garage);
  const garage = await garageRepo.findOne({
    where: { id: garageId },
    relations: ['cars'],
  });
  if (!garage) {
    throw new Error('Garage not found');
  }
  return garage;
};

export const updateGarage = async (
  garageId: number,
  ownerId: number,
  data: GarageUpdateDTO
) => {
  const garageRepo = AppDataSource.getRepository(Garage);
  const garage = await garageRepo.findOne({ where: { id: garageId } });
  if (!garage) throw new Error('Garage not found');
  if (garage.ownerId !== ownerId) throw new Error('Forbidden: Not garage owner');

  await garageRepo.update(garageId, {
    ...(data.name && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.pictureUrl !== undefined && { pictureUrl: data.pictureUrl }),
    ...(data.coverImageUrl !== undefined && {
      coverImageUrl: data.coverImageUrl,
    }),
    ...(data.location !== undefined && { location: data.location }),
  });
  return getGarageById(garageId);
};

export const deleteGarage = async (garageId: number, ownerId: number) => {
  const garageRepo = AppDataSource.getRepository(Garage);
  const garage = await garageRepo.findOne({ where: { id: garageId } });
  if (!garage) throw new Error('Garage not found');
  if (garage.ownerId !== ownerId) throw new Error('Forbidden: Not garage owner');

  await garageRepo.delete(garageId);
  return { message: 'Garage deleted successfully' };
};

export const getUserGarages = async (
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const garageRepo = AppDataSource.getRepository(Garage);
  const [garages, total] = await garageRepo.findAndCount({
    where: { ownerId: userId },
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return { garages, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const searchGarages = async (
  query: string,
  location?: string,
  page: number = 1,
  limit: number = 10
) => {
  const garageRepo = AppDataSource.getRepository(Garage);
  const qb = garageRepo.createQueryBuilder('garage');

  if (query && query.trim()) {
    qb.andWhere(
      '(garage.name ILIKE :q OR garage.description ILIKE :q)',
      { q: `%${query.trim()}%` }
    );
  }
  if (location && location.trim()) {
    qb.andWhere('garage.location ILIKE :loc', {
      loc: `%${location.trim()}%`,
    });
  }

  qb.orderBy('garage.followersCount', 'DESC')
    .addOrderBy('garage.createdAt', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  const [garages, total] = await qb.getManyAndCount();
  return {
    garages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const deleteGarageByOwnerID = async (ownerID: number): Promise<boolean> => {
  const garageRepo = AppDataSource.getRepository(Garage);
  const deleteResult = await garageRepo.delete({ ownerId: ownerID });
  if (deleteResult.affected === 0) {
    console.log(`No garages found for userId ${ownerID}—nothing to delete.`);
  }
  return true;
};

const garageService = {
  createGarage,
  getGarageById,
  updateGarage,
  deleteGarage,
  getUserGarages,
  searchGarages,
  deleteGarageByOwnerID,
};

export default garageService;
