from pathlib import Path
import sys

app = Path(sys.argv[1])
main = app / "main.c"
practice = app / "exam_practice.c"

p = practice.read_text(encoding="utf-8")
old_start = p.index("static void bac_page(const char *heading, const char *body) {")
old_end = p.index("\n/* Originals", old_start)
new_page = """static void bac_page(const char *heading, const char *body) {
  /* NumWorks small font: 31 ASCII characters per line, so nothing vanishes offscreen. */
  char buffer[72][36];
  const char *lines[72];
  int n=0, col=0;
  if (!body) return;
  while (*body && n<71) {
    if (*body=='|' || *body=='\\n' || col>=31) {
      buffer[n][col]=0;
      lines[n]=buffer[n];
      n++; col=0;
      if (*body=='|' || *body=='\\n') { body++; continue; }
    }
    if (col<35) buffer[n][col++]=*body;
    body++;
  }
  if (n<72) { buffer[n][col]=0; lines[n]=buffer[n]; n++; }
  message(heading,lines,n);
}
"""
p = p[:old_start] + new_page + p[old_end:]
p = p.replace("MODELE : PAC, T en °C", "MATHS : f(T) sur [5;20]")
p = p.replace("Donner le signe de p'", "Justifier signe de p'")
p = p.replace("EXERCICES MATHS TYPE BAC", "MATHS : PAR CHAPITRE")
p = p.replace("EXERCICES PHYS TYPE BAC", "PHYSIQUE : PAR CHAPITRE")
p = p.replace("ENONCE TYPE BAC", "ENONCE DU COURS")
p = p.replace('if(c==0) bac_page("ENONCE DU COURS",b->question);','if(c==0) bac_page("ENONCE DU COURS",b->question);')
p = p.replace('if(c==2) bac_page("REDIGER SUR COPIE",b->solution);', 'if(c==2) bac_page("CORRECTION PAS A PAS",b->solution);')
p = p.replace('const char *choices[]={"LIRE L\'ENONCE","JE VEUX UN INDICE","VOIR CORRECTION DETAILLEE","TESTER MA REPONSE","AUTRE EXERCICE"};', 'const char *choices[]={"RELIRE L\'ENONCE","INDICE (SANS REPONSE)","CORRECTION PAS A PAS","VERIFIER MA REPONSE","RETOUR AUX EXERCICES"};')
p = p.replace('  const BacCase *b=&bac_cases[id];\n  for(;;)', '  const BacCase *b=&bac_cases[id];\n  bac_page("EXERCICE - ENONCE",b->question);\n  if (g_exit_app) return;\n  for(;;)')
p = p.replace('if(c==0) bac_page("ENONCE DU COURS",b->question);','if(c==0) bac_page("EXERCICE - ENONCE",b->question);')
p = p.replace('"MATHS : ENTRAINEMENT"','"MATHS : CHAPITRES"')
p = p.replace('"PHYS : ENTRAINEMENT"','"PHYS : CHAPITRES"')

start = p.index("static void bac_about(void) {")
p = p[:start] + """static void bac_about(void) {
  bac_page("COMMENT UTILISER",
   "1 - Choisis MATHS ou PHYSIQUE.|"
   "2 - Choisis un chapitre.|"
   "3 - Lis le vrai format de question.|"
   "4 - Essaie sur une feuille.|"
   "5 - INDICE si tu bloques.|"
   "6 - CORRECTION : formule,|calcul, justification, resultat.|"
   "Pour ta propre fonction f(x),|ouvre SAISIR f(x).|"
   "Pour la physique entre les|valeurs dans CALCUL GUIDE.|"
   "Ces exemples sont ORIGINAUX,|inspires du style Terminale STI2D.|"
   "Ce n'est PAS un sujet PCM.|"
   "HOME : retour au NumWorks officiel.");
}

static void bac_hub(void) {
  const char *items[]={
    "MATHS : EXERCICES DU COURS",
    "PHYSIQUE : EXERCICES COURS",
    "MATHS : ECRIRE f(x)",
    "MATHS : CALCUL GUIDÉ",
    "PHYS : CALCUL GUIDÉ",
    "COMMENT CA MARCHE ?"
  };
  for(;;) {
    int c=list_menu("EXERCICES PAR CHAPITRE",items,6);
    if(c<0||g_exit_app)return;
    if(c==0) bac_practice_subject(0);
    if(c==1) bac_practice_subject(1);
    if(c==2) fx_solver();
    if(c==3) bac_guided_math();
    if(c==4) bac_guided_phys();
    if(c==5) bac_about();
  }
}
"""
assert "static void bac_hub(void)" in p
assert "EXERCICES MATHS TYPE BAC" not in p
practice.write_text(p,encoding="utf-8")

src = main.read_text(encoding="utf-8")
assert '#include "math_solver.c"' in src, "Use V4 patched main source first"
src = src.replace('= "STI2D OS V4";','= "STI2D EXOS V5";')
src = src.replace('text_at("V4",252,10,false,C_PURP,C_BG);','text_at("V5",252,10,false,C_PURP,C_BG);')
src = src.replace('"Resoudre","Avance"', '"Exercices","Avance"')
src = src.replace('"FX","ADV"', '"EXO","ADV"')

decl='static void bac_hub(void);\nstatic void bac_practice_subject(int subject);\nstatic void bac_guided_math(void);\nstatic void bac_guided_phys(void);\n'
src = src.replace('static void fx_solver(void);\nstatic void math_menu(void)', decl+'static void fx_solver(void);\nstatic void math_menu(void)',1)
start=src.index('static void math_menu(void) {')
end=src.index('\n/* ---------------- SUITES ---------------- */',start)
src=src[:start]+"""static void math_menu(void) {
  const char *items[]={
    "RESOUDRE : SAISIR f(x)",
    "EXERCICES PAR CHAPITRE",
    "CALCUL GUIDE PAR COEFFICIENTS",
    "DERIVEES : REGLES",
    "TANGENTE : f(a), f'(a)",
    "1/x : FONCTION INVERSE"
  };
  for(;;) {
    int c=list_menu("MATHS - COURS",items,6);
    if(c<0 || g_exit_app) return;
    if(c==0) fx_solver();
    if(c==1) bac_practice_subject(0);
    if(c==2) bac_guided_math();
    if(c==3) math_derivative();
    if(c==4) math_tangent();
    if(c==5) math_inverse();
  }
}
""" + src[end:]

src=src.replace("static void physics_menu(void) {","static void converter(void);\nstatic void physics_menu(void) {",1)
start=src.index('static void physics_menu(void) {')
end=src.index('\n/* ---------------- CONVERTER ---------------- */', start)
src=src[:start]+"""static void physics_menu(void) {
  const char *items[]={
    "EXERCICES PAR CHAPITRE",
    "RESOUDRE : VALEURS",
    "P Q S : cos(phi)",
    "BATTERIE : Ah, Wh",
    "E = P * DELTA t",
    "CONVERSIONS DES UNITES"
  };
  for(;;) {
    int c=list_menu("PHYSIQUE - COURS",items,6);
    if(c<0 || g_exit_app) return;
    if(c==0) bac_practice_subject(1);
    if(c==1) bac_guided_phys();
    if(c==2) ac_power_menu();
    if(c==3) battery_menu();
    if(c==4) {
      double P,t;
      if(input_double("P [W]",&P)||input_double("Delta t [s]",&t)) continue;
      char x[64],y[64];
      double E=P*t;
      snprintf(x,64,"E=P*t = %.6g J",E);
      snprintf(y,64,"= %.6g Wh",E/3600);
      const char *lines[]={x,y,"1 Wh=3600 J"};
      message("E - ENERGIE",lines,3);
    }
    if(c==5) converter();
  }
}
""" + src[end:]
src=src.replace('else if(s==6) fx_solver();','else if(s==6) bac_hub();')
assert "else if(s==6) bac_hub();" in src
src += '\n#include "exam_practice.c"\n'
main.write_text(src,encoding="utf-8")
print("Patched lesson-based STI2D OS V5",main.stat().st_size,practice.stat().st_size)
