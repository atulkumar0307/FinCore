import bcrypt from "bcrypt";
import { createUser, findUserByEmail, findUserById } from "./user.repository.js";
import { User, LoginResponse, PublicUser } from "./user.types.js";
import { AppError } from "../../shared/errors/app.error.js";
import { createAccessToken } from "../../shared/auth/jwt.js";
export async function registerUser(
    name: string,
    email: string,
    password: string
): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    try{
        return await createUser(name, email, hashedPassword);
    }catch( error: unknown){
        if(
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23505"
        ){
            throw new AppError(
                409,
                "Email is already registered!"
            );
        }
        throw error;
    }
}

export async function loginUser(
    email: string,
    password: string
): Promise<LoginResponse | null> {
    const user = await findUserByEmail(email);

    if(!user){
        return null;
    }
    const passwordMatches = await bcrypt.compare(password, user.password);

    if(!passwordMatches){
        return null;
    }

    const accessToken = createAccessToken({
        userId: user.id,
    })
    
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        },
        accessToken,
    };
}

export async function getCurrentUser(
    userid: string
): Promise<PublicUser | null> {
    return await findUserById(userid);
}