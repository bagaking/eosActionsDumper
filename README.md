# eosActionsDumper

Tools for dumping eos accounts to mongodb

## install

```bash
npm i -g eos-actions-dumper
```

## usage

```bash
eos-action-dumper <accounts> [Options]
```

### Options

```bash
  --watch, -w    The watcher's retry time span. If the span is less than 0, only
                 execute once.                                     [default: -1]
  --url, -u      mongo connection string.
                                        [default: "mongodb://localhost/actions"]
  -h, --help     Show help                                             [boolean]
  -v, --version  Show version number                                   [boolean]
```

### Examples

```bash
eos-action-dumper tonartstoken ctserver2111 --watch 2000
```
