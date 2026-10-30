import { clerkClient } from '@clerk/express';
import Course from '../models/Course.js';
import { v2 as cloudinary } from 'cloudinary';

// update role to educator
export const updateRoleToEducator = async (req, res) => {
    try {
        const auth = req.auth();
        const userId = auth?.userId;
        
        // Safety check: Stop execution if there is no User ID
        if (!userId) {
            return res.json({ 
                success: false, 
                message: "Unauthorized: No valid user ID found in the request." 
            });
        }

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            }
        });

        res.json({ success: true, message: 'You can publish a course now' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// add new course
export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body;
        const imageFile = req.file; 
        
        const auth = req.auth();
        const educatorId = auth?.userId;

        // Safety check: Stop execution if Postman token is expired
        if (!educatorId) {
            return res.json({ success: false, message: "Unauthorized: Token expired or invalid." });
        }

        if (!imageFile) {
            return res.json({ success: false, message: 'Thumbnail not attached' });
        }

        const parsedCourseData = JSON.parse(courseData);
        parsedCourseData.educator = educatorId;
        
        const newCourse = await Course.create(parsedCourseData);
        
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "auto" });
        newCourse.courseThumbnail = imageUpload.secure_url;
        
        await newCourse.save();
        
        res.json({ success: true, message: 'Course added' });
    } catch (error) {
        res.json({ success: false, message: "CLOUDINARY ERROR: " + error.message });
    }
}

//get educator courses
export const getEducatorCourses=async(req,res)=>{
    try{
        const educator=req.auth().userId
        const courses=await Course.find({educator})
        res.json({success:true,courses})
    }catch(error){
        res.json({success:false,message:error.message})
    }
}

//get educator dashboard data (total earning,enrolled students,no. of courses)
export const educatorDashboardData=async()=>{
    try{
        const educator=req.auth().userId;
        const courses=await Course.find({educator});
        const totalCourses=courses.length;
        const courseIds=courses.map(course=>course._id);

        //calculate total earnings from purchases
        const purchases=await Purchase.find({
            courseId:{$in:courseIds},
            status:'completed'
        });
        const totalEarnings=purchases.reduce((sum,purchase)=>sum+purchase.amount,0);

        //collect unique enrolled student IDs with their course titles
        const enrolledStudentsData=[];
        for(const course of courses){
            const students=await User.find({
                _id: {$in:course.enrolledStudents}
            },'name imageUrl')
            students.forEach(student=>{
                enrolledStudentsData.push({
                    courseTitle:course.courseTitle,
                    student
                });
            });
        }
        res.json({success:true,dashboardData:{
            totalEarnings,enrolledStudentsData,totalCourses
        }})
    }catch(error){
        res.json({success:false,message:error.message});
    }
}

//get enrolled students data with purchase data
export const getEnrolledStudentsData=async(req,res)=>{
    try{
        const educator=req.auth().userId;
        const courses=await Course.find({educator});
        const courseIds=courses.map(course=>course._id);

        const purchases=await Purchase.find({
            courseId:{$in:courseIds},
            status:'completed'
        }).populate('userId','name imageUrl').populate('courseId','courseTitle')
        const enrolledStudents=purchases.map(purchase=>({
            student:purchase.userId,
            courseTitle:purchase.courseId.courseTitle,
            purchaseDate:purchase.createdAt
        }));
        res.json({success:true,enrolledStudents})
    }catch(error){
        res.json({success:false,message:error.message});
    }
}