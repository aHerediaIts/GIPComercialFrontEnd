import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ReporteTiempo } from 'src/app/model/reporte-tiempo';
import { ReporteTiempoService } from 'src/app/service/reporte-tiempo.service';
import { Cliente } from 'src/app/model/cliente';
import { ClienteService } from 'src/app/service/cliente.service';
import { EmpleadoService } from 'src/app/service/empleado.service';
import { ActividadService } from 'src/app/service/actividad.service';
import { ActividadAsignada } from 'src/app/model/actividad-asignada';
import { ProyectoService } from 'src/app/service/proyecto.service';
import { Proyecto } from 'src/app/Model/proyecto';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmpleadoString } from 'src/app/model/dto/empleado-string';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Actividad } from 'src/app/model/actividad';
import { EstadoReporteTiempo } from 'src/app/model/estado-reporte-tiempo';

@Component({
  selector: 'app-carga-masiva',
  templateUrl: './carga-masiva-component.html',
  styleUrls: ['./carga-masiva-component.scss']
})

export class CargaMasivaComponent implements OnInit {

  reporte: any;
  reporteTemp: ReporteTiempo = new ReporteTiempo();
  listReportes: ReporteTiempo[] = [];
  file: File;
  formCliente: FormGroup;
  dataSource = new MatTableDataSource();

  constructor(
    private reporteTiempoService: ReporteTiempoService,
    private empleadoService: EmpleadoService,
    private actividadService: ActividadService,
    private clienteService: ClienteService,
    private proyectoService: ProyectoService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastr: ToastrService) { }

  columnas: string[] = ['Cliente', 'Proyecto', 'Actividad', 'NombresRecurso', 'FechaReporte', 'Horas'];
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
  }

  get fp() { return this.formCliente.controls; }

  buildFormCliente() {
    this.formCliente = this.formBuilder.group({
      archivo: ['', []],
    });
  }

  onSubmit() {
    console.log(this.file);

    if (this.formCliente.invalid || this.file === undefined) {
      this.formCliente.markAllAsTouched();
      return;
    }


    this.listReportes.length = 0;

    this.reporte.forEach(obj => {
      this.reporteTemp.actividad = new ActividadAsignada();
      this.reporteTemp.estado = new EstadoReporteTiempo();
      this.actividadService.getActividadByActividad(obj.Actividad).subscribe(data => {
        this.reporteTemp.actividad.actividad = data;
      })

      this.reporteTemp.fecha = obj.FechaReporte;
      this.reporteTemp.horas = obj.Horas;


      this.proyectoService.getProyectoByName(obj.Proyecto).subscribe(data => {
        this.reporteTemp.proyecto = data;
        this.reporteTemp.actividad.proyecto = data;
        this.reporteTemp.estado.id = 1;
        this.empleadoService.getEmpleadoByNombre(obj.NombreRecurso).subscribe(data => {
          this.reporteTemp.empleado = data;
        }, error => {
          console.log(error.error.message);
        });
      }, error => {
        console.log(error.error.message);
      });

      this.listReportes.push(this.reporteTemp);
      this.reporteTiempoService.enviarProyectoInt(this.reporteTemp).subscribe(data => {
        console.log(this.reporte);
        this.toastr.success('Reporte enviado correctamente!');
      }, error => {
        this.toastr.error(error.error);
      });
    })

    console.log(this.listReportes);


    // window.location.reload();
  }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
    if (this.file) {
      this.proyectoService.createCargaMasiva(this.file).subscribe(data => {
        this.reporte = data;
        this.dataSource = new MatTableDataSource(this.castListObjectToStringList(this.reporte));
        this.dataSource.paginator = this.paginator;
        console.log(this.reporte);
      }, error => {
        console.log(error);
        this.toastr.error("El archivo no cuenta con los campos deseados.");
      })
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
  FechaReporte: Date;
  Horas: number;
}