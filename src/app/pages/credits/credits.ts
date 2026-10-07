import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-credits',
  imports: [RouterLink],
  template: `
    <main class="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <h1 class="text-3xl font-black tracking-wide text-[#f0d060]">Créditos</h1>
      <div class="space-y-3 text-[#f7f3e8]">
        <p>Super Mario Jungla es un plataformas de selva jugable en el navegador.</p>
        <p>Hecho con Angular. Los niveles viven en archivos JSON, listos para llevarse a otra plataforma.</p>
        <p>El personaje, el templo y los escenarios son arte original. Sin música, por ahora.</p>
      </div>
      <a
        routerLink="/"
        class="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f0d060] px-8 font-bold text-[#24180c] no-underline"
      >
        Volver al menú
      </a>
    </main>
  `,
})
export class Credits {}
