import { writeFileSync } from 'fs';

// Create a simple ICO file with the Excel Analytics theme
// This is a base64 encoded 32x32 ICO file with an "E" and chart representation

const icoData = `AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAA////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAlZv8AJWB//yVm//8lZv//JWb//yVm//8lZv//JWb//yVm//8lZv//JWb//yVm//8lZv//JWb//yVm/wD///8AJWB//wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8lZv8A////ACVm//8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/JWb/AP///wAlZv//AAAA/////////////////////////////////wAAAP////////////////////////////////8lZv8A////ACVm//8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/EzP//xMz//8TM///EzP//wAAAP8AAAD/JWb/AP///wAlZv//AAAA/////////////////////////////////xMz//8TM///EzP//xMz//////////////////8lZv8A////ACVm//8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/EzP//xMz//8TM///EzP//wAAAP8AAAD/JWb/AP///wAlZv//AAAA/////////////////////////////////xMz//8TM///EzP//xMz//////////////////8lZv8A////ACVm//8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/EzP//xMz//8TM///EzP//wAAAP8AAAD/JWb/AP///wAlZv//AAAA/////////////////////////////////xMz//8TM///EzP//xMz//////////////////8lZv8A////ACVm//8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/JWb/AP///wAlZv//AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/yVm/wD///8AJWB//yVm//8lZv//JWb//yVm//8lZv//JWb//yVm//8lZv//JWb//yVm//8lZv//JWb//yVm//8lZv8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`;

// Convert base64 to buffer and write to file
const buffer = Buffer.from(icoData, 'base64');
writeFileSync('favicon-new.ico', buffer);

console.log('Custom Excel Analytics favicon created: favicon-new.ico');
