import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Cliente } from 'src/app/model/cliente';
import { ClienteService } from 'src/app/service/cliente.service';
import { ProyectoService } from 'src/app/service/proyecto.service';
import { Proyecto } from 'src/app/Model/proyecto';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmpleadoString } from 'src/app/model/dto/empleado-string';
import { error } from 'console';

@Component({
  selector: 'app-carga-masiva',
  templateUrl: './carga-masiva-component.html',
  styleUrls: ['./carga-masiva-component.scss']
})

export class CargaMasivaComponent implements OnInit {

  clientes: Cliente[] = [];
  proyectos: Proyecto[] = [];
  proyectosFiltrados: Proyecto[] = [];
  cliente: Cliente;
  proyecto: Proyecto;
  file: File;

  formCliente: FormGroup;

  constructor(
    private clienteService: ClienteService,
    private proyectoService: ProyectoService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastr: ToastrService) { }

  session = localStorage.getItem('session');
  sessionObject: EmpleadoString = new EmpleadoString();

  ngOnInit(): void {
    this.sessionObject = JSON.parse(this.session);
    this.session = JSON.parse(this.session);

    if (this.session['rol'] != 'ROL_ADMIN' && this.session['rol'] != 'ROL_LP' && this.session['rol'] != 'ROL_GP' && this.session['rol'] != 'ROL_DP') {
      this.router.navigate(['/error']);
    }

    this.getClientes();
    this.getProyectos();
    this.buildFormCliente();
  }

  get fp() { return this.formCliente.controls; }

  buildFormCliente() {
    this.formCliente = this.formBuilder.group({
      cliente: ['', [
        Validators.required
      ]],
      proyecto: ['', [
        Validators.required
      ]],
      archivo: ['',[]],
    });
  }

  getProyectos() {
    this.proyectoService.getProyectosList().subscribe(data => {
      this.proyectos = data;
      console.log(this.proyectos);
    }, error => {
      console.log(error);
    })
  }

  getClientes() {
    this.clienteService.getClientesList().subscribe(data => {
      this.clientes = data;
      console.log(this.clientes);
    }, error => {
      console.log(error);
    })
  }

  filtrarProyectos() {
    this.proyectosFiltrados = this.proyectos.filter(p => p.cliente.nomenclatura === this.cliente.nomenclatura && ![6, 8, 9].includes(p.estadoProyecto.id));
  }


  onSubmit() {
    console.log(this.file);
    if (this.formCliente.invalid || this.file === undefined) {
      this.formCliente.markAllAsTouched();
      return;
    }

    this.proyectoService.createCargaMasiva(this.file).subscribe(data => {
      console.log(data);
      this.toastr.success("Cargue realizado Correctamente");
    }, error => {
      console.log(error);
      this.toastr.error("El archivo no cuenta con los campos deseados.");
    })

    
    // window.location.reload();
  }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
    if (this.file) {
      console.log('Archivo seleccionado:', this.file);
    }
  }
}
