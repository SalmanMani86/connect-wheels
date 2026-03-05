import { DeepPartial } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Car } from '../entity/car';
import { CarMedia } from '../entity/car-media';
import { Garage } from '../entity/garage';
import { CarDTO, CarUpdateDTO } from '../dtos/car-dto';

const carRepo = () => AppDataSource.getRepository(Car);
const carMediaRepo = () => AppDataSource.getRepository(CarMedia);
const garageRepo = () => AppDataSource.getRepository(Garage);

export const addCar = async (
  garageId: number,
  ownerId: number,
  data: Omit<CarDTO, 'garageId'>
) => {
  const garage = await garageRepo().findOne({ where: { id: garageId } });
  if (!garage) throw new Error('Garage not found');
  if (garage.ownerId !== ownerId) throw new Error('Forbidden: Not garage owner');

  const mediaUrls = data.mediaUrls ?? [];
  const pictureUrl = data.pictureUrl ?? mediaUrls[0];

  const toSave: DeepPartial<Car> = {
    garageId,
    make: data.make,
    model: data.model,
    year: data.year,
    color: data.color ?? undefined,
    vin: data.vin ?? undefined,
    mileage: data.mileage ?? undefined,
    engineType: data.engineType ?? undefined,
    transmission: data.transmission ?? undefined,
    pictureUrl: pictureUrl ?? undefined,
    description: data.description ?? undefined,
  };
  const car = await carRepo().save(toSave);

  if (mediaUrls.length > 0) {
    const mediaItems = mediaUrls.map((url, i) => ({
      carId: car.id,
      mediaUrl: url,
      mediaType: 'image' as const,
      displayOrder: i,
    }));
    await carMediaRepo().save(mediaItems);
  }

  await garageRepo().increment({ id: garageId }, 'carsCount', 1);

  const created = await carRepo().findOne({ where: { id: car.id } });
  const media = await carMediaRepo().find({
    where: { carId: car.id },
    order: { displayOrder: 'ASC' },
  });
  return { message: 'Car added successfully', car: { ...created, media } };
};

export const browseCars = async (
  page: number = 1,
  limit: number = 20,
  search?: string
) => {
  const query = carRepo()
    .createQueryBuilder('car')
    .leftJoinAndSelect('car.media', 'media')
    .leftJoinAndSelect('car.garage', 'garage')
    .orderBy('car.createdAt', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  if (search?.trim()) {
    query.where(
      '(LOWER(car.make) LIKE :s OR LOWER(car.model) LIKE :s OR LOWER(car.color) LIKE :s OR LOWER(car.engineType) LIKE :s)',
      { s: `%${search.trim().toLowerCase()}%` }
    );
  }

  const [cars, total] = await query.getManyAndCount();
  return { cars, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getGarageCars = async (
  garageId: number,
  page: number = 1,
  limit: number = 10
) => {
  const [cars, total] = await carRepo().findAndCount({
    where: { garageId },
    relations: ['media'],
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return { cars, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getCarById = async (garageId: number, carId: number) => {
  const car = await carRepo().findOne({
    where: { id: carId, garageId },
    relations: ['media'],
  });
  if (!car) throw new Error('Car not found');
  return car;
};

export const updateCar = async (
  garageId: number,
  carId: number,
  ownerId: number,
  data: CarUpdateDTO
) => {
  const garage = await garageRepo().findOne({ where: { id: garageId } });
  if (!garage) throw new Error('Garage not found');
  if (garage.ownerId !== ownerId) throw new Error('Forbidden: Not garage owner');

  const car = await carRepo().findOne({ where: { id: carId, garageId } });
  if (!car) throw new Error('Car not found');

  await carRepo().update(carId, {
    ...(data.make && { make: data.make }),
    ...(data.model && { model: data.model }),
    ...(data.year && { year: data.year }),
    ...(data.color !== undefined && { color: data.color }),
    ...(data.vin !== undefined && { vin: data.vin }),
    ...(data.mileage !== undefined && { mileage: data.mileage }),
    ...(data.engineType !== undefined && { engineType: data.engineType }),
    ...(data.transmission !== undefined && { transmission: data.transmission }),
    ...(data.pictureUrl !== undefined && { pictureUrl: data.pictureUrl }),
    ...(data.description !== undefined && { description: data.description }),
  });

  if (data.mediaUrls !== undefined) {
    await carMediaRepo().delete({ carId });
    if (data.mediaUrls.length > 0) {
      const mediaItems = data.mediaUrls.map((url, i) => ({
        carId,
        mediaUrl: url,
        mediaType: 'image' as const,
        displayOrder: i,
      }));
      await carMediaRepo().save(mediaItems);
      if (!data.pictureUrl) {
        await carRepo().update(carId, { pictureUrl: data.mediaUrls[0] });
      }
    }
  }

  return getCarById(garageId, carId);
};

export const deleteCar = async (
  garageId: number,
  carId: number,
  ownerId: number
) => {
  const garage = await garageRepo().findOne({ where: { id: garageId } });
  if (!garage) throw new Error('Garage not found');
  if (garage.ownerId !== ownerId) throw new Error('Forbidden: Not garage owner');

  const car = await carRepo().findOne({ where: { id: carId, garageId } });
  if (!car) throw new Error('Car not found');

  await carRepo().delete(carId);
  await garageRepo().decrement({ id: garageId }, 'carsCount', 1);

  return { message: 'Car deleted successfully' };
};

const carService = {
  browseCars,
  addCar,
  getGarageCars,
  getCarById,
  updateCar,
  deleteCar,
};

export default carService;
