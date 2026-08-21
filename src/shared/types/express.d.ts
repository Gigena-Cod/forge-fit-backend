declare global { namespace Express { interface Request { auth?: { userId: string; gymId: string; role: string } } } }
export {}
