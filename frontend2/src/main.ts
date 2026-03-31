import './style.css';
import { AuthService } from './auth';
import { S3Browser } from './s3';
import { AudioPlayer } from './player';
import { App } from './app';

const auth = new AuthService();
const s3 = new S3Browser(auth);
const player = new AudioPlayer(s3);
const app = new App(auth, s3, player);

app.mount(document.getElementById('app')!);
