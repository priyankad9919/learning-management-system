{/*import { clerkClient } from "@clerk/express";

//middleware protect educator routes
export const protectEducator=async(req,res,next)=>{
    try{
        const userId=req.auth().userId
        const response=await clerkClient.users.getUser(userId)
        if(response.publicMetadata.role!=='educator'){
            return res.json({success:false, message:'Unauthorized access'})
        }
        next()
    }catch(error){
        res.json({success:false,message:error.message})
    }
}*/}
import { clerkClient } from "@clerk/express";

// middleware protect educator routes
export const protectEducator = async (req, res, next) => {
    try {
        const userId = req.auth().userId;
        
        // Safety check: Stop execution if the token is expired/invalid
        if (!userId) {
            return res.json({ success: false, message: 'Unauthorized: Token expired or missing.' });
        }

        const response = await clerkClient.users.getUser(userId);
        
        if (response.publicMetadata.role !== 'educator') {
            return res.json({ success: false, message: 'Unauthorized access' });
        }
        
        next();
    } catch (error) {
        res.json({ success: false, message: "CLERK ERROR: " + error.message });
    }
}