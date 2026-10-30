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