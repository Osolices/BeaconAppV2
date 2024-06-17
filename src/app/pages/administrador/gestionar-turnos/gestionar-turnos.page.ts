import { filter } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as bootstrap from 'bootstrap';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../servicio/auth.service';
import { ModalController } from '@ionic/angular';
import { ViewChild } from '@angular/core';
import { IonSelect, IonTextarea, IonInput, IonDatetime } from '@ionic/angular';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestionar-turnos',
  templateUrl: './gestionar-turnos.page.html',
  styleUrls: ['./gestionar-turnos.page.scss'],
})
export class GestionarTurnosPage implements OnInit {
  asignaciones: any[] = [];
  turnos: any[] = [];
  sedes: any[] = [];
  sede_new: any;

  @ViewChild('asignacionSelect') asignacionSelect!: IonSelect;
  @ViewChild('sedeSelect') sedeSelect!: IonSelect;
  @ViewChild('fechaInput') fechaInput!: IonInput;
  @ViewChild('ctdGuardiasInput') ctdGuardiasInput!: IonInput;
  @ViewChild('horaIniInput') horaIniInput!: IonInput;
  @ViewChild('horaFinInput') horaFinInput!: IonInput;
  @ViewChild('remuInput') remuInput!: IonInput;
  @ViewChild('sedeID') sedeID!: IonInput;

  @ViewChild('sedeSelectC') sedeSelectC!: IonSelect;
  @ViewChild('fechaInputC') fechaInputC!: IonInput;
  @ViewChild('ctdGuardiasInputC') ctdGuardiasInputC!: IonInput;
  @ViewChild('horaIniInputC') horaIniInputC!: IonInput;
  @ViewChild('horaFinInputC') horaFinInputC!: IonInput;
  @ViewChild('remuInputC') remuInputC!: IonInput;
  @ViewChild('sedeIDC') sedeIDC!: IonInput;
  

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.getTurnos();
  }

  getTurnos() {
    this.http
      .get(`https://osolices.pythonanywhere.com/turno/`)
      .subscribe((turnos: any) => {

        const fechaActual = new Date().toISOString().split('T')[0];
        console.log(fechaActual)
        const turnosActual = turnos.filter((t: any) =>  new Date(t.fecha) >= new Date(fechaActual));
        turnosActual.forEach((turno: any) => {

          this.http.get(`https://osolices.pythonanywhere.com/sede/`).subscribe((sedeData: any) => {
            console.log(sedeData);
            const sede = sedeData.filter((sedeData: any) => sedeData.id_sede === turno.id_sede);
            const nombre = sede[0].nombre;
            const direccion = sede[0].direccion;
            const foto = sede[0].foto;
  
            console.log(nombre);
            console.log(direccion);
            console.log(foto);
  
            turno.nombre = nombre;
            turno.direccion = direccion;
            turno.foto = foto;
  
            this.turnos.push(turno);
            console.log(this.turnos);
          });
        }); 
      });
  }

  obtenerSedes(){
    this.sedes = [];
    this.http.get(`https://osolices.pythonanywhere.com/sede/`).subscribe((sedeData: any) => {
      console.log(sedeData);
      this.sedes.push(...sedeData);
      console.log(this.sedes)
    });
  }


  async confirmarActualizar(id_turno: any) {
    const result = await Swal.fire({
      title: 'Confirmación',
      text: '¿Estás seguro desea modificar este turno?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, modificar',
      cancelButtonText: 'No, cancelar',
      heightAuto: false,
      confirmButtonColor: 'rgb(57, 88, 134)',
    });
  
    if (result.isConfirmed) {
      await this.actualizarTurnos(id_turno);
    }
  }
 actualizarTurnos(id_turno:any) {
 
  const sede_old = this.sedeID.value;
  const sede_new = this.sedeSelect.value ? this.sedeSelect.value.id_sede : this.sedeID.value;
  const fecha = this.fechaInput.value;
  const hora_ini = this.horaIniInput.value;
  const hora_fin = this.horaFinInput.value;
  const remuneracion = this.remuInput.value;
  const ctd_guardias = this.ctdGuardiasInput.value;

  if (sede_old !== sede_new) {
    this.sede_new= sede_new;
  }else{
    this.sede_new= sede_old;
  }
  console.log(id_turno);
  console.log(this.sede_new);
  console.log(fecha);
  console.log(hora_ini);
  console.log(hora_fin);
  console.log(remuneracion);
  console.log(ctd_guardias);

const body=  {
  id_turno: id_turno,
  fecha: fecha,
  horario_inicio: hora_ini,
  hora_fin: hora_fin,
  remuneracion: remuneracion,
  ctd_guardias: ctd_guardias,
  id_sede: this.sede_new
};
  this.http.put(`https://osolices.pythonanywhere.com/turno/${id_turno}/`, body)
    .subscribe(
      response => {
        console.log(response);
        this.toast('Turno Modificado exitosamente')
        this.modalController.dismiss();
      },
      error => {
        console.error(error);
        this.toast('Error al modificar')
      }
    );
}

async confirmarEliminar(id_turno: any) {
  const result = await Swal.fire({
    title: 'Confirmación',
    text: '¿Estás seguro desea eliminar este turno?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'No, cancelar',
    heightAuto: false,
    confirmButtonColor: 'rgb(57, 88, 134)',
  });

  if (result.isConfirmed) {
    await this.eliminarTurno(id_turno);
  }
}

eliminarTurno(id_turno: any) {
  this.http.delete(`https://osolices.pythonanywhere.com/turno/${id_turno}/`)
    .subscribe(
      response => {
        console.log(response);
        this.toast('Turno eliminado exitosamente');
        this.turnos= [];
        this.getTurnos();
      },
      error => {
        console.error(error);
        this.toast('Error al eliminar');
      }
    );
}

async confirmarCrear() {
  const result = await Swal.fire({
    title: 'Confirmación',
    text: '¿Estás seguro desea crear este turno?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, crear',
    cancelButtonText: 'No, cancelar',
    heightAuto: false,
    confirmButtonColor: 'rgb(57, 88, 134)',
  });

  if (result.isConfirmed) {
    await this.crearTurno();
  }
}

crearTurno(){
  console.log(this.sedeSelectC.value.id_sede)

  const sede = this.sedeSelectC.value.id_sede;
  const fecha = this.fechaInputC.value;
  const hora_ini = this.horaIniInputC.value;
  const hora_fin = this.horaFinInputC.value;
  const remuneracion = this.remuInputC.value;
  const ctd_guardias = this.ctdGuardiasInputC.value;


  console.log(sede);
  console.log(fecha);
  console.log(hora_ini);
  console.log(hora_fin);
  console.log(remuneracion);
  console.log(ctd_guardias);

const body=  {
  fecha: fecha,
  horario_inicio: hora_ini,
  hora_fin: hora_fin,
  remuneracion: remuneracion,
  ctd_guardias: ctd_guardias,
  id_sede: sede
};

this.http.post(`https://osolices.pythonanywhere.com/turno/`, body)
    .subscribe(
      response => {
        console.log(response);
        this.toast('Turno creado exitosamente');
        this.turnos= [];
        this.getTurnos();
        this.modalController.dismiss();
      },
      error => {
        console.error(error);
        this.toast('Error al crear');
      }
    );
}

toast(mensaje: string) {
  const toast = document.createElement('ion-toast');
  toast.message = mensaje;
  toast.duration = 2000;
  toast.cssClass = 'my-toast'; // Añade esta línea

  document.body.appendChild(toast);
  return toast.present();
}

obtenerAsignaciones(id_turno:any){
  this.asignaciones = [];
  this.http.get(`https://osolices.pythonanywhere.com/asignacionturno/${id_turno}/`).subscribe((asignacion: any) => {
    console.log(asignacion);
    this.http.get(`https://osolices.pythonanywhere.com/guardia/${asignacion.rut_guarida}/`).subscribe((guardia: any) => {
      console.log(guardia);

      asignacion.nombre = guardia.p_nombre + guardia.p_apellido;

        this.asignaciones.push(asignacion);
        console.log(this.asignaciones)
      });
    });
}

async confirmarEliminarAsignacion(){
  const result = await Swal.fire({
    title: 'Confirmación',
    text: '¿Estás seguro desea crear este turno?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, crear',
    cancelButtonText: 'No, cancelar',
    heightAuto: false,
    confirmButtonColor: 'rgb(57, 88, 134)',
  });

  if (result.isConfirmed) {
    await this.eliminarAsignacion();
  }
}

eliminarAsignacion(){
  const asignacion = this.asignacionSelect.value ? this.asignacionSelect.value.id_asignacion : this.asignacionSelect.value;

  this.http.delete(`https://osolices.pythonanywhere.com/asignacionturno/${asignacion}/`)
  .subscribe(
    response => {
      console.log(response);
      this.toast('Asignacion eliminada exitosamente');
      this.turnos= [];
      this.getTurnos();
      this.modalController.dismiss();
    },
    error => {
      console.error(error);
      this.toast('Error al eliminar');
    }
  );

}


}
