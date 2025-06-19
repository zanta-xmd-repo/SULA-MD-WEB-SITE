import fs from 'fs';
import path from 'path';
import util from 'util';

const unlink = util.promisify(fs.unlink);

export async function removeFile(directory) {
    try {
        if (fs.existsSync(directory)) {
            fs.rmSync(directory, { recursive: true, force: true });
            console.log(`Removed: ${directory}`);
        }
    } catch (err) {
        console.error('Error removing directory:', err);
    }
}

export async function upload(stream, filename) {
    const tempPath = `/tmp/${filename}`;
    const writeStream = fs.createWriteStream(tempPath);

    return new Promise((resolve, reject) => {
        stream.pipe(writeStream);
        writeStream.on('finish', () => {
            console.log('File saved to', tempPath);
            resolve(`https://dummyupload.com/${filename}`);
        });
        writeStream.on('error', reject);
    });
}
