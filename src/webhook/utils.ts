
//Convert buffer to json
export const bufferToJson = (buffer: Buffer) => {
   return JSON.parse(buffer.toString());
};