import { catchError } from 'rxjs/operators';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../servicio/auth.service';
import { ModalController, Platform } from '@ionic/angular';
import { ViewChild } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';
import * as moment from 'moment-timezone';
import { File } from '@awesome-cordova-plugins/file';
import { FileOpener } from '@awesome-cordova-plugins/file-opener';
import * as ExcelJS from 'exceljs';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;



@Component({
  selector: 'app-gestionar-incidencias',
  templateUrl: './gestionar-incidencias.page.html',
  styleUrls: ['./gestionar-incidencias.page.scss'],
})
export class GestionarIncidenciasPage implements OnInit {
  logo: any;
  filas: any[] = [];
  incidencias: any[] = [];
  currentValue = new Date().toISOString();
  currentValueSede = 0;
  currentNombreSede = 'Todas';
  showModal = false;
  showModalSede = false;
  @ViewChild('modal') modal: any;
  @ViewChild('modalSede') modalSede: any;
  sedes: any[] = [];
  pdfObj:any;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private modalController: ModalController,
    private platform: Platform
  ) {}

  ngOnInit() {
    this.getIncidencias();
  }

  getIncidencias() {
    this.http
      .get(`https://osolices.pythonanywhere.com/incidencia/`)
      .subscribe((incidencias: any) => {
        incidencias.forEach((inci: any) => {
          this.http
            .get(
              `https://osolices.pythonanywhere.com/asignacionturno/${inci.id_asignacion}/`
            )
            .subscribe((asignacion: any) => {
              console.log(asignacion);
              this.http
                .get(
                  `https://osolices.pythonanywhere.com/turno/${asignacion.id_turno}/`
                )
                .subscribe((turno: any) => {
                  console.log(turno);
                  const fecha_seleccionada = this.currentValue
                    .toString()
                    .split('T')[0];
                  const fechaSeleSplit = fecha_seleccionada.split('-');
                  const yearCurrent = fechaSeleSplit[0];
                  const monthCurrent = fechaSeleSplit[1];
                  const fecha = turno.fecha;
                  const fechaSplit = fecha.split('-');
                  const year = fechaSplit[0];
                  const month = fechaSplit[1];
                  console.log(year + '-' + month);
                  console.log(yearCurrent + '-' + monthCurrent);
                  if (year + '-' + month === yearCurrent + '-' + monthCurrent) {
                    this.http
                      .get(
                        `https://osolices.pythonanywhere.com/sede/${turno.id_sede}/`
                      )
                      .subscribe((sede: any) => {
                        console.log(sede);
                        this.http
                          .get(
                            `https://osolices.pythonanywhere.com/guardia/${asignacion.rut_guarida}/`
                          )
                          .subscribe((guardia: any) => {
                            console.log(guardia);

                            inci.id_turno = asignacion.id_turno;
                            inci.guardia =
                              guardia.p_nombre + ' ' + guardia.p_apellido;
                            inci.fecha = turno.fecha;
                            inci.id_sede = sede.id_sede;
                            inci.sede = sede.nombre;
                            inci.direccion = sede.direccion;
                            console.log(inci.id_sede);
                            console.log(this.currentValueSede);
                            const existeIncidencia = this.incidencias.some(
                              (inc) => inc.id_incidencia === inci.id_incidencia
                            );

                            // Si no existe y cumple con la condición, entonces agrega la incidencia
                            if (
                              !existeIncidencia &&
                              (this.currentValueSede === 0 ||
                                inci.id_sede == this.currentValueSede)
                            ) {
                              this.incidencias.push(inci);
                              this.incidencias.sort(
                                (a, b) => b.id_incidencia - a.id_incidencia
                              );
                            }

                            console.log(this.incidencias);
                          });
                      });
                  }
                });
            });
        });
      });
  }

  getSedes() {
    this.http
      .get(`https://osolices.pythonanywhere.com/sede/`)
      .subscribe((sede: any) => {
        console.log(sede);

        this.sedes.push(...sede);
      });
  }

  getNombreSede(id_sede:any){
    this.http
      .get(`https://osolices.pythonanywhere.com/sede/${id_sede}/`)
      .subscribe((sede: any) => {
        console.log(sede);

        this.currentNombreSede= sede.nombre;
      });
  }

  openModalFecha() {
    this.showModal = true;
  }

  openModalSede() {
    this.getSedes();
    this.showModalSede = true;
  }

  onDidDismissFecha(event: CustomEvent) {
    console.log('Fecha seleccionada:', this.currentValue);
    this.showModal = false;
  }

  onDidDismissSede(event: CustomEvent) {
    console.log('Sede seleccionada:', this.currentValueSede);
    this.showModalSede = false;
  }

  onIonChange(event: CustomEvent) {
    this.currentValue = event.detail.value;
    this.incidencias = [];
    this.getIncidencias();
  }

  onSedeChange(event: CustomEvent) {
    this.currentValueSede = event.detail.value;
    this.getNombreSede(this.currentValueSede);
    this.incidencias = [];
    this.getIncidencias();
  }

  toast(mensaje: string) {
    const toast = document.createElement('ion-toast');
    toast.message = mensaje;
    toast.duration = 2000;
    toast.cssClass = 'my-toast'; // Añade esta línea

    document.body.appendChild(toast);
    return toast.present();
  }
  async confirmarCrear() {
    const result = await Swal.fire({
      title: 'Confirmación',
      text: '¿Estás seguro desea generar este informe?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'No, cancelar',
      heightAuto: false,
      confirmButtonColor: 'rgb(57, 88, 134)',
    });

    if (result.isConfirmed) {
      this.createPDF();
    }
  }
  
  async createPDF() {
    try {
      const docDefinition = await this.getPdfDefinition(); // Asegúrate de esperar la definición del documento
      this.pdfObj = pdfMake.createPdf(docDefinition);
      await this.downloadPdf(); // Espera a que se complete la descarga
    } catch (error) {
      console.error('Error creating PDF', error);
    }
  }

  async downloadPdf() {
    const fecha = moment().tz('America/Santiago').format();
    const fecha2 = fecha.toString().split('T')[0]; 
    const hora=  fecha.toString().split('T')[1]; 
    const hora1= hora.toString().split(':')[0];
    const hora2= hora.toString().split(':')[1];  
    const fileName = 'reporte_incidencia_' + fecha2 +'_'+hora1+'-'+hora2+'.pdf';
    if (this.platform.is('cordova')) {
      this.pdfObj.getBuffer(async (buffer: any) => {
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const filePath = File.dataDirectory + fileName;
  
        try {
          await File.writeFile(File.dataDirectory, fileName, blob, { replace: true });
          console.log('File written:', filePath); // Esto te mostrará la ruta exacta del archivo guardado
          await FileOpener.open(filePath, 'application/pdf');
        } catch (err) {
          console.error('Error writing file', err);
        }
      });
    } else {
      this.pdfObj.download(fileName); // Asegúrate de pasar el nombre del archivo aquí también
    }
  }


  getPdfDefinition(){
    const fecha = moment().tz('America/Santiago').format();
    const fecha2 = fecha.toString().split('T')[0]; 
    const hora=  fecha.toString().split('T')[1]; 
    const hora1= hora.toString().split(':')[0];
    const hora2= hora.toString().split(':')[1];  
    const incidencias = this.incidencias;
    this.filas = []; // Asegúrate de inicializar this.filas como un arreglo vacío
  
  incidencias.forEach(incidencia => {
    // Suponiendo que 'incidencia' es un objeto con las propiedades que quieres mostrar
    const fila = [
      incidencia.id_incidencia, 
      incidencia.sede, 
      incidencia.direccion, 
      incidencia.fecha, 
      incidencia.guardia, 
      incidencia.detalle_incidencia
    ];
    this.filas.push(fila); // Agrega cada 'fila' al arreglo 'this.filas'
  });
  // Uso de la función
 
  const body= [
      ['ID', 'Sede', 'Direccion', 'Fecha', 'Guardia', 'Detalle'],
      ...this.filas      
    ]
  console.log(body)
    var dd = {
      content: [
        {
          text: 'Reporte Incidencias',
          style: 'header'
        },
        {
          text: 'Generado el ' +fecha2+ ' a las ' +hora1+':'+hora2,
          style: 'subheader'
        },
        {
          style: 'tableExample',
          table: {
            body: body, 
          }, 
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true
        },
        subheader: {
          fontSize: 15,
          bold: true
        },
        quote: {
          italics: true
        },
        tableExample: {
          margin: 5
        },
       
      }

    }
    return dd;
  }
  async confirmarCrearExcel() {
    const result = await Swal.fire({
      title: 'Confirmación',
      text: '¿Estás seguro desea generar este informe?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'No, cancelar',
      heightAuto: false,
      confirmButtonColor: 'rgb(57, 88, 134)',
    });

    if (result.isConfirmed) {
      this.generateAndSaveReport();
    }
  }
  async createExcel(): Promise<ExcelJS.Buffer> {
    // Crea un nuevo libro de trabajo y una hoja
    const fecha = moment().tz('America/Santiago').format('YYYYMMDD_HHmm');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Incidencias_'+fecha+'');
    // Añade los datos

    // Define las columnas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Sede', key: 'sede', width: 30 },
      { header: 'Direccion', key: 'direccion', width: 30 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Guardia', key: 'guardia', width: 20 },
      { header: 'Detalle', key: 'detalle', width: 30 },

    ];

    this.incidencias.forEach(incidencia => {
      worksheet.addRow({
        id: incidencia.id_incidencia,
        sede: incidencia.sede,
        direccion: incidencia.direccion,
        fecha: incidencia.fecha,
        guardia: incidencia.guardia,
        detalle: incidencia.detalle_incidencia,
      });
    });

    // Escribe el libro de trabajo en formato binario
    return await workbook.xlsx.writeBuffer();
  }

   uint8ArrayToBase64(buffer: Uint8Array) {
    const binary = buffer.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return btoa(binary);
  }
  
  async saveFileToDevice(data: ExcelJS.Buffer) {
    const fecha = moment().tz('America/Santiago').format('YYYYMMDD_HHmm');
    const fileName = `reporte_incidencias_${fecha}.xlsx`;
  
    try {
      await Filesystem.writeFile({
        path: fileName,
        data: this.uint8ArrayToBase64(new Uint8Array(data)),
        directory: Directory.Documents,
        recursive: true
      });
      console.log('File saved successfully.');
    } catch (e) {
      console.error('Unable to save file', e);
    }
  }

  async generateAndSaveReport() {
    try {
      const excelBuffer = await this.createExcel();
      await this.saveFileToDevice(excelBuffer);
    } catch (error) {
      console.error('Error generating or saving report:', error);
    }
  }
}
