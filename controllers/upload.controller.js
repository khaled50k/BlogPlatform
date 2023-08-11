const cloudinary = require('../config/cloudinary.config');
const mime = require('mime');
const sharp = require('sharp'); // Import the sharp library
const fs=require('fs')
exports.uploadPhoto = async (req, res) => {
  try {
    console.log(req);
    const photoFile = req.files.photo;

    if (!photoFile) {
      throw new Error("Invalid file");
    }

    // Check if the uploaded file is an image
    const mimeType = mime.getType(photoFile.name);
    if (!mimeType.startsWith('image/')) {
      throw new Error("Only image files are allowed");
    }

    // Resize image using sharp library
    const resizedImagePath = `${photoFile.tempFilePath}-resized.jpg`; // Specify the output path for resized image
    await sharp(photoFile.tempFilePath)
      .resize({ width: 413, height: 413 }) // Specify the desired width and height
      .toFile(resizedImagePath);

    // Upload resized image file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      resizedImagePath,
      {
        resource_type: "auto",
        use_filename: true,
        folder: "photos", // Optional: Specify a folder in your Cloudinary account
      }
    );

    // Return the image URL and other details
    const imageUrl = uploadResult.secure_url;

    // Delete the resized image file
    fs.unlinkSync(resizedImagePath);

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Failed to upload photo:", error);
    res.status(500).json({ error: error.message || "Failed to upload photo" });
  }
};
