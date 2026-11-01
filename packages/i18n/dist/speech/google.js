// WIP - to be moved ...
// more samples : https://cloud.google.com/nodejs/docs/reference/speech/latest
// playground : https://cloud.google.com/text-to-speech
// api center : https://console.cloud.google.com/apis/library/speech.googleapis.com?project=shoposr&flow=gcp
// rest schema : https://speech.googleapis.com/$discovery/rest?version=v1
// google api docs : https://cloud.google.com/apis/docs/client-libraries-explained
// pcm player example : https://gist.github.com/anaptfox/64951815358ba545f94ff864c02887da
// ssml specs: https://www.w3.org/TR/speech-synthesis11/
// ssml specs@google: https://cloud.google.com/text-to-speech/docs/ssml
// google - api - types: node_modules\@google-cloud\speech\build\protos\protos.d.ts
// google list of voices: https://cloud.google.com/text-to-speech/docs/voices | GET https://texttospeech.googleapis.com/v1beta1/voices
// HTTP and gRPC Transcoding, https://google.aip.dev/127
// gg - auth flows : https://cloud.google.com/docs/authentication/
// gg auth samples : https://cloud.google.com/text-to-speech/docs/libraries
// gg dialogflow, https://cloud.google.com/dialogflow/es/docs/video 
const speech = require('@google-cloud/speech');
import { v1p1beta1 } from '@google-cloud/speech';
` Request Body, to https://texttospeech.googleapis.com/v1beta1/text:synthesize
{
    "audioConfig": {
      "audioEncoding": "LINEAR16",
      "pitch": 0,
      "speakingRate": 1
    },
    "input": {
      "text": "Google Cloud Text-to-Speech enables developers to synthesize natural-sounding speech with 100+ voices, available in multiple languages and variants. It applies DeepMind’s groundbreaking research in WaveNet and Google’s powerful neural networks to deliver the highest fidelity possible. As an easy-to-use API, you can create lifelike interactions with your users, across many applications and devices."
    },
    "voice": {
      "languageCode": "en-US",
      "name": "en-US-Wavenet-D"
    }
  }
`;
export const speak = (text, options) => {
    //const client = new SpeechClient();
    const betaClient = new v1p1beta1.SpeechClient();
};
// Creates a client
const client = new speech.SpeechClient();
async function quickstart() {
    // The path to the remote LINEAR16 file
    const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw';
    // The audio file's encoding, sample rate in hertz, and BCP-47 language code
    const audio = {
        uri: gcsUri,
    };
    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
    };
    const request = {
        audio: audio,
        config: config,
    };
    // Detects speech in the audio file
    const [response] = await client.recognize(request);
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
    console.log(`Transcription: ${transcription}`);
}
// quickstart();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NwZWVjaC9nb29nbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsd0JBQXdCO0FBQ3hCLDhFQUE4RTtBQUM5RSx1REFBdUQ7QUFDdkQsNEdBQTRHO0FBQzVHLHlFQUF5RTtBQUN6RSxrRkFBa0Y7QUFDbEYseUZBQXlGO0FBQ3pGLHdEQUF3RDtBQUN4RCx1RUFBdUU7QUFFdkUsbUZBQW1GO0FBQ25GLHNJQUFzSTtBQUV0SSx3REFBd0Q7QUFFeEQsa0VBQWtFO0FBQ2xFLDJFQUEyRTtBQUczRSxvRUFBb0U7QUFHcEUsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFFL0MsT0FBTyxFQUFnQixTQUFTLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUcvRDs7Ozs7Ozs7Ozs7Ozs7O0NBZUMsQ0FBQTtBQUdELE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLElBQVksRUFBRSxPQUFZLEVBQUUsRUFBRTtJQUNoRCxvQ0FBb0M7SUFDcEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7QUFFcEQsQ0FBQyxDQUFBO0FBRUQsbUJBQW1CO0FBQ25CLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBRXpDLEtBQUssVUFBVSxVQUFVO0lBQ3JCLHVDQUF1QztJQUN2QyxNQUFNLE1BQU0sR0FBRyxvREFBb0QsQ0FBQztJQUVwRSw0RUFBNEU7SUFDNUUsTUFBTSxLQUFLLEdBQUc7UUFDVixHQUFHLEVBQUUsTUFBTTtLQUNkLENBQUM7SUFDRixNQUFNLE1BQU0sR0FBRztRQUNYLFFBQVEsRUFBRSxVQUFVO1FBQ3BCLGVBQWUsRUFBRSxLQUFLO1FBQ3RCLFlBQVksRUFBRSxPQUFPO0tBQ3hCLENBQUM7SUFDRixNQUFNLE9BQU8sR0FBRztRQUNaLEtBQUssRUFBRSxLQUFLO1FBQ1osTUFBTSxFQUFFLE1BQU07S0FDakIsQ0FBQztJQUVGLG1DQUFtQztJQUNuQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25ELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxPQUFPO1NBQ2pDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO1NBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixhQUFhLEVBQUUsQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFDRCxnQkFBZ0IifQ==