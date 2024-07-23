import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../services/firebase";

const upload = async (file) => {
  try {
    console.log("Starting file upload");
    const date = new Date().getTime();
    const storageRef = ref(storage, `images/${date}_${file.name}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          console.error("Error during upload:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          reject(`Upload failed: ${error.message}`);
        },
        async () => {
          try {
            console.log("Upload completed, getting download URL");
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("File available at", downloadURL);
            resolve(downloadURL);
          } catch (urlError) {
            console.error("Error getting download URL:", urlError);
            console.error("Error code:", urlError.code);
            console.error("Error message:", urlError.message);
            reject(`Failed to get download URL: ${urlError.message}`);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error in upload function:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
};

export default upload;