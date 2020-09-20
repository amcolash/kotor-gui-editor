declare interface GFF {
  gff3: {
    type: string;
    struct: Struct[];
  };
}

declare interface Id {
  id: string;
}

declare interface Value {
  $t: string;
}

declare interface Label {
  label: string;
}

declare interface Primitive extends Label, Value {}

declare interface sint32 extends Primitive {}
declare interface uint32 extends Primitive {}
declare interface byte extends Primitive {}
declare interface exostring extends Primitive {}
declare interface float extends Primitive {}
declare interface resref extends Primitive {}
declare interface double extends Value {}

declare interface Vector extends Label {
  double: double[];
}

declare interface List extends Label {
  struct: Struct[];
}

declare interface Struct extends Id {
  label?: string;

  sint32?: sint32[];
  uint32?: uint32[];
  byte?: byte[];
  exostring?: exostring[];
  float?: float[];
  resref?: resref[];

  vector?: Vector[];
  list?: List;
  struct?: Struct[];
}
