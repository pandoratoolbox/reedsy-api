//BONUS - Operations

export class Move {
  count: number;

  constructor(count: number) {
    this.count = count;
  }
}

export class Insert {
  text: string;

  constructor(text: string) {
    this.text = text;
  }
}

export class Delete {
  count: number;

  constructor(count: number) {
    this.count = count;
  }
}

export class Operation {
  sequence: Array<Move | Insert | Delete>;

  constructor(data: Array<Move | Insert | Delete>) {
    this.sequence = data;
    
  }

  combine(op: Operation) {
    op.sequence.forEach(action => {
      this.sequence.push(action)
    })
  }

  apply(doc: string) {
    let index = 0;
    this.sequence.forEach((seq) => {
      switch (seq.constructor) {
        case Move:
          let move = <Move>seq;
          index += move.count;
          break;
        case Insert:
          let insert = <Insert>seq;
          doc = [doc.slice(0, index), insert.text, doc.slice(index)].join('');
          //does the caret move to the end of the inserted string? if not, comment out the line underneath
          index += insert.text.length
          break;
        case Delete:
          let del = <Delete>seq;
          doc = doc.slice(0, index) + doc.slice(index + del.count);
          break;
      }
    });
    return doc;
  }
}


function combine(op1: Operation, op2: Operation) {
  let seq: Array<Move | Insert| Delete> = []

  op1.sequence.forEach(ac => {
    seq.push(ac)
  })

  op2.sequence.forEach(ac => {
    seq.push(ac)
  })

  return new Operation(seq)
}

export function testOperations() {
  let sequence1 = [new Insert('First'), new Insert("Second")];
  let op1 = new Operation(sequence1);
  
  let sequence2 = [new Move(-6), new Delete(2), new Insert('Third'),new Insert("Fourth")];
  let op2 = new Operation(sequence2)
  
  //static combine method
  let combined = combine(op1, op2)
  console.log(combined.apply("Original"));
  
  //prototype combine method
  op1.combine(op2)
  console.log(op1.apply("Original"));

  console.log("Now we can combine/apply any amount of any type of operations in any order using one class.")
}