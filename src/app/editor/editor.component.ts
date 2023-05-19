import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as cv from 'opencv-ts';
import * as Tone from 'tone';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

  private animationFrameId: number = 0;
  private isProcessing: boolean = false;


  ngOnInit() {
  }

  cargarVideo(event: Event): void {
    const file: File | undefined = (event.target as HTMLInputElement).files?.[0];

    if (file) {
      const video: HTMLVideoElement = this.videoElement.nativeElement;
      video.src = URL.createObjectURL(file);
      video.load();
      video.play();
    }
  }

  aplicarEfectoVideo(efecto: string): void {
    const video: HTMLVideoElement = this.videoElement.nativeElement;
    const canvas: HTMLCanvasElement = this.canvasElement.nativeElement;
    const context: CanvasRenderingContext2D | null = canvas.getContext('2d');

    if (context && video.readyState === 4) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      const frameRate = 30; // Frame rate del video (ajustar según el video cargado)

      const applyEffectToFrame = () => {
        if (video.paused || video.ended) {
          this.stopProcessing();
          return;
        }

        context.drawImage(video, 0, 0, width, height);

        const imageData: ImageData = context.getImageData(0, 0, width, height);
        const srcMat: cv.Mat = cv.default.matFromImageData(imageData);
        const dstMat: cv.Mat = new cv.default.Mat();

        if (efecto === 'sobel') {
          cv.default.cvtColor(srcMat, srcMat, cv.default.COLOR_RGBA2GRAY);
          cv.default.Sobel(srcMat, dstMat, cv.default.CV_8U, 1, 1, 7, 1, 0, cv.default.BORDER_DEFAULT);

          cv.default.imshow(canvas, dstMat);

        } else if (efecto === 'blur') {
          cv.default.blur(srcMat, dstMat, new cv.default.Size(10, 10), new cv.default.Point(-1, -1), cv.default.BORDER_DEFAULT);

          // Mostrar el video con el efecto aplicado
          cv.default.imshow(canvas, dstMat);
        }

        // Mostrar el video con el efecto aplicado
        context.drawImage(canvas, 0, 0, width, height);

        this.animationFrameId = requestAnimationFrame(applyEffectToFrame);
      };

      this.stopProcessing();
      this.isProcessing = true;
      this.animationFrameId = requestAnimationFrame(applyEffectToFrame);
    }
  }

  aplicarEfectoAudio(efecto: string): void {
    const video: HTMLVideoElement = this.videoElement.nativeElement;

    if (efecto === 'Flanger') {
      // Crear el contexto de Audio
      const audioContext = new window.AudioContext();

      // Obtener el elemento de audio del video
      const videoSource = audioContext.createMediaElementSource(video);

      // Crear los nodos de efecto
      const flangerNode = audioContext.createDelay();
      const lfoNode = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const outputNode = audioContext.destination;

      // Configurar los parámetros del efecto
      const delayTime = 0.05; // Ajustar el tiempo de retardo del flanger
      const depth = 0.5; // Ajustar la profundidad del flanger
      const rate = 0.2; // Ajustar la velocidad del oscilador LFO

      // Configurar el oscilador LFO
      lfoNode.type = 'sine';
      lfoNode.frequency.value = rate;
      lfoNode.start();

      // Conectar los nodos en la cadena de efectos
      videoSource.connect(flangerNode);
      flangerNode.connect(outputNode);

      // Conectar el oscilador LFO al parámetro de retardo del Flanger
      lfoNode.connect(flangerNode.delayTime);

      // Configurar el efecto Flanger
      flangerNode.delayTime.value = delayTime;
      gainNode.gain.value = depth;

      // Crear el efecto de retardo fluctuante del Flanger
      const fluctuation = audioContext.createGain();
      fluctuation.gain.value = depth;
      lfoNode.connect(fluctuation.gain);

      // Conectar el efecto de retardo fluctuante al nodo de ganancia
      flangerNode.connect(fluctuation);

      // Conectar el nodo de ganancia al nodo de salida
      fluctuation.connect(gainNode);

      // Conectar el nodo de ganancia al nodo de salida
      gainNode.connect(outputNode);

      // Iniciar el contexto de Audio
      audioContext.resume();
    }

    if (efecto == 'Wah-wah') {

      // Obtener el contexto de audio
      const audioContext = new AudioContext();

      // Crear el nodo de entrada para el video
      const videoSource = audioContext.createMediaElementSource(video);

      // Crear el nodo de filtro pasa banda
      const filterNode = audioContext.createBiquadFilter();
      filterNode.type = 'bandpass';

      // Crear el nodo de oscilador para modular la frecuencia de corte
      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.frequency.value = 6; // Frecuencia de oscilación en Hz

      // Conectar los nodos en la cadena de efectos
      videoSource.connect(filterNode);
      filterNode.connect(audioContext.destination);
      oscillatorNode.connect(filterNode.frequency);

      // Iniciar el oscilador
      oscillatorNode.start();

      // Pausar el efecto cuando se pausa el video
      video.addEventListener('pause', () => {
        audioContext.suspend();
      });

      // Reanudar el efecto cuando se reanuda el video
      video.addEventListener('play', () => {
        audioContext.resume();
      });
    }

    if (efecto == 'Tremolo') {
      // Obtener el contexto de audio
      const audioContext = new AudioContext();

      // Crear el nodo de entrada para el video
      const videoSource = audioContext.createMediaElementSource(video);

      // Crear el nodo de ganancia
      const gainNode = audioContext.createGain();

      // Crear el nodo de oscilador para modular la ganancia
      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.frequency.value = 5; // Frecuencia de oscilación en Hz

      // Conectar los nodos en la cadena de efectos
      videoSource.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillatorNode.connect(gainNode.gain);

      // Iniciar el oscilador
      oscillatorNode.start();

      // Pausar el efecto cuando se pausa el video
      video.addEventListener('pause', () => {
        audioContext.suspend();
      });

      // Reanudar el efecto cuando se reanuda el video
      video.addEventListener('play', () => {
        audioContext.resume();
      });
    }

    if (efecto == 'Delay') {
      // Crear el contexto de Audio
    const audioContext = new AudioContext();

    // Obtener el elemento de audio del video
    const videoSource = audioContext.createMediaElementSource(video);

    // Crear el nodo de efecto Delay
    const delayNode = audioContext.createDelay();
    delayNode.delayTime.value = 0.5; // Ajustar el tiempo de retardo en segundos

    // Conectar los nodos en la cadena de efectos
    videoSource.connect(delayNode);
    delayNode.connect(audioContext.destination);

    // Iniciar el contexto de Audio
    audioContext.resume();
    }

    if (efecto == 'Fuzz') {
      // Crear el contexto de Audio
      const audioContext = new AudioContext();

      // Obtener el elemento de audio del video
      const videoSource = audioContext.createMediaElementSource(video);

      // Crear los nodos de efecto
      const fuzzNode = audioContext.createWaveShaper();
      const compressionNode = audioContext.createDynamicsCompressor();
      const outputNode = audioContext.destination;

      // Configurar los parámetros del efecto
      const fuzzAmount = 0.8; // Ajustar la cantidad de distorsión del fuzz
      const compressionThreshold = -20; // Ajustar el umbral de compresión
      const compressionRatio = 4; // Ajustar la relación de compresión

      // Definir la curva de distorsión para el efecto Fuzz
      const curve = new Float32Array(4096);
      for (let i = 0; i < 4096; i++) {
        const x = i * 2 / 4096 - 1;
        curve[i] = (Math.abs(x) + fuzzAmount * x) / (1 + fuzzAmount);
      }
      fuzzNode.curve = curve;

      // Conectar los nodos en la cadena de efectos
      videoSource.connect(fuzzNode);
      fuzzNode.connect(compressionNode);
      compressionNode.connect(outputNode);

      // Configurar los parámetros de compresión
      compressionNode.threshold.value = compressionThreshold;
      compressionNode.ratio.value = compressionRatio;

      // Iniciar el contexto de Audio
      audioContext.resume();
    }
  }


  private stopProcessing(): void {
    this.isProcessing = false;
    cancelAnimationFrame(this.animationFrameId);
  }
  
  
  exportarVideo() {
    const videoElement = this.videoElement.nativeElement;
    const canvasElement = this.canvasElement.nativeElement;
  
    // Verificar si el video está cargado
    if (!videoElement.src || videoElement.paused) {
      alert("Carga un video y presiona el botón de reproducir antes de exportar.");
      return;
    }
  
    // Configurar el lienzo con las mismas dimensiones que el video
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  
    // Obtener el contexto 2D del lienzo
    const ctx = canvasElement.getContext("2d")!;
  
    // Iniciar la grabación de fotogramas
    const frames: string[] = [];
  
    function grabarFrame() {
      // Dibujar el fotograma actual en el lienzo
      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  
      // Obtener los datos de la imagen del lienzo en formato de imagen PNG
      const frameDataUrl = canvasElement.toDataURL("image/png");
  
      // Agregar los datos del fotograma al arreglo
      frames.push(frameDataUrl);
  
      // Reproducir el siguiente fotograma
      if (!videoElement.paused && !videoElement.ended) {
        requestAnimationFrame(grabarFrame);
      } else {
        // Finalizar la grabación y exportar el video
        exportarVideo(frames);
      }
    }
  
    // Iniciar la grabación
    grabarFrame();
  
    // Función para exportar el video
    function exportarVideo(frames: any[]) {
      const framePromises = frames.map((frameDataUrl: string, index: any) => {
        return new Promise<void>((resolve, reject) => {
          // Crear una nueva imagen a partir de los datos del fotograma
          const img = new Image();
          img.onload = () => {
            // Dibujar la imagen en el lienzo
            ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);
  
            // Resolver la promesa cuando la imagen se haya dibujado correctamente
            resolve();
          };
          img.onerror = reject;
          img.src = frameDataUrl;
        });
      });
  
      // Esperar a que todos los fotogramas se hayan dibujado en el lienzo
      Promise.all(framePromises)
        .then(() => {
          // Crear un objeto MediaRecorder para grabar el video a partir de los fotogramas dibujados en el lienzo
          const stream = canvasElement.captureStream();
          const chunks: BlobPart[] | undefined = [];
          const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  
          // Escuchar el evento 'dataavailable' para capturar los fragmentos de video
          mediaRecorder.addEventListener("dataavailable", event => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          });
  
          // Escuchar el evento 'stop' para finalizar la grabación y exportar el video
          mediaRecorder.addEventListener("stop", () => {
            const blob = new Blob(chunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
  
            // Crear un enlace para descargar el video
            const a = document.createElement("a");
            a.href = url;
            a.download = "video.webm";
            a.click();
  
            // Liberar los recursos
            URL.revokeObjectURL(url);
          });
  
          // Iniciar la grabación
          mediaRecorder.start();
  
          // Detener la grabación después de unos segundos (ajusta la duración según tus necesidades)
          setTimeout(() => {
            mediaRecorder.stop();
          }, 5000); // Detener después de 5 segundos (ejemplo)
        })
        .catch(error => {
          console.error("Error al dibujar los fotogramas en el lienzo:", error);
        });
    }
  }
  
  
}
