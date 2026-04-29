import appPromise from '../app_server';

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
