import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, throwError  } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ReporteTiempo } from 'src/app/model/reporte-tiempo';
import { ReporteTiempoService } from 'src/app/service/reporte-tiempo.service';
import { EmpleadoService } from 'src/app/service/empleado.service';
import { ActividadService } from 'src/app/service/actividad.service';
import { ActividadAsignada } from 'src/app/model/actividad-asignada';
import { ProyectoService } from 'src/app/service/proyecto.service';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmpleadoString } from 'src/app/model/dto/empleado-string';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { EstadoActividadAsig } from 'src/app/model/estado-actividad-asig';
import { EstadoActividadAsigService } from 'src/app/service/estado-actividad-asig.service';

@Component({
  selector: 'app-carga-masiva',
  templateUrl: './carga-masiva-component.html',
  styleUrls: ['./carga-masiva-component.scss']
})

export class CargaMasivaComponent implements OnInit {

  reporte: any;
  camposCorrectos: boolean = false;
  estado: EstadoActividadAsig = new EstadoActividadAsig();
  reporteTemp: ReporteTiempo = new ReporteTiempo();
  listReportes: ReporteTiempo[] = [];
  file: File;
  formCliente: FormGroup;
  dataSource = new MatTableDataSource();

  constructor(
    private estadoActividadAsignadaService: EstadoActividadAsigService,
    private reporteTiempoService: ReporteTiempoService,
    private empleadoService: EmpleadoService,
    private actividadService: ActividadService,
    private proyectoService: ProyectoService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastr: ToastrService) { }

  columnas: string[] = ['Cliente', 'Proyecto', 'Actividad', 'NombresRecurso', 'Justificacion', 'FechaReporte', 'Horas'];
  session = localStorage.getItem('session');
  sessionObject: EmpleadoString = new EmpleadoString();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit(): void {
    this.sessionObject = JSON.parse(this.session);
    this.session = JSON.parse(this.session);

    if (this.session['rol'] != 'ROL_ADMIN' && this.session['rol'] != 'ROL_LP' && this.session['rol'] != 'ROL_GP' && this.session['rol'] != 'ROL_DP') {
      this.router.navigate(['/error']);
    }
    this.buildFormCliente();
    this.estadosReportes();
  }

  estadosReportes() {
    this.estadoActividadAsignadaService.getEstadoById(1).subscribe(data => {
      this.estado = data;
    });
  }
  get fp() { return this.formCliente.controls; }

  buildFormCliente() {
    this.formCliente = this.formBuilder.group({
      archivo: ['', []],
    });
  }

  onSubmit() {
    if (this.formCliente.invalid || this.file === undefined) {
      this.formCliente.markAllAsTouched();
      return;
    }

    this.listReportes.length = 0;

    const observables = this.reporte.map((obj, index) => {  
      return forkJoin([
        this.actividadService.getActividadByActividad(obj.Actividad).pipe(
          catchError(error => {
            this.toastr.error(`Error al obtener la actividad de la celda número ${index + 2}: ${error.error.message}`);
            return throwError(error);
          })
        ),
        this.proyectoService.getProyectoByName(obj.Proyecto).pipe(
          catchError(error => {
            this.toastr.error(`Error al obtener el proyecto de la celda número ${index + 2}: ${error.error.message}`);
            return throwError(error);
          })
        ),
        this.empleadoService.getEmpleadoByNombre(obj.NombreRecurso).pipe(
          catchError(error => {
            this.toastr.error(`Error al obtener el empleado de la celda número ${index + 2}: ${error.error.message}`);
            return throwError(error);
          })
        )
      ]).pipe(
        tap(([actividad, proyecto, empleado]) => {
          this.reporteTemp = new ReporteTiempo();
          this.reporteTemp.actividad = new ActividadAsignada();
          this.reporteTemp.actividad.estado = this.estado;

          this.reporteTemp.actividad.actividad = actividad;
          this.reporteTemp.fecha = obj.FechaReporte;
          this.reporteTemp.horas = obj.Horas;
          this.reporteTemp.justificacion = obj.Justificacion;
          this.reporteTemp.proyecto = proyecto;
          this.reporteTemp.actividad.proyecto = proyecto;
          this.reporteTemp.empleado = empleado;
          this.listReportes.push(this.reporteTemp);
        })
      );
    });

    forkJoin(observables).subscribe(() => {
      if (this.reporte.length === this.listReportes.length) {
        this.reporteTiempoService.cargaMasiva(this.listReportes).subscribe(data => {
          this.toastr.success('Reporte enviado correctamente!');
        }, error => {
          this.toastr.error(error.error.message);
        });
      }
    });
  }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
    this.camposCorrectos = false;

    if (this.file) {
      this.proyectoService.createCargaMasiva(this.file).subscribe(data => {
        this.reporte = data;
        this.camposCorrectos = true;
        this.dataSource = new MatTableDataSource(this.castListObjectToStringList(this.reporte));
        this.dataSource.paginator = this.paginator;
      }, error => {
        console.log(error);
        this.toastr.error(error.error);
        this.resetFile();
      })
    }
  }

  resetFile(){
    this.file = undefined;
    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  castListObjectToStringList(listaObj: any[]) {
    let listString: ReporteList[] = [];

    listaObj.forEach(obj => {
      let string: ReporteList = new ReporteList();
      string.Actividad = obj.Actividad;
      string.Cliente = obj.Cliente;
      string.FechaReporte = obj.FechaReporte;
      string.Horas = obj.Horas;
      string.Proyecto = obj.Proyecto;
      string.Justificacion = obj.Justificacion;
      string.NombreRecurso = obj.NombreRecurso;
      listString.push(string);
    });

    return listString;
  }
}

export class ReporteList {
  Cliente: string;
  Proyecto: string;
  Actividad: string;
  NombreRecurso: string;
  Justificacion: string;
  FechaReporte: Date;
  Horas: number;
}