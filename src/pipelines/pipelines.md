# Pipelines

> Note: Pipelines are still in development. A GUI is being worked on.

Pipelines are a way to call multiple extensions together.

A pipeline is a JSON file that looks like this:
```json
[{
  "id": "My_Pipeline",
  "name": "My_Pipeline",
  "input": "search",
  "output": "answer",
  "trigger": "call",
  "steps": [
    {
      "action": "extension_name",
      "id": "one",
      "inputs": [
        {
          "step": "input"
        }
      ]
    },
    {
      "action": "bash",
      "id": "2",
      "inputs": [
        {
          "step": "one"
        }
      ]
    },
    {
      "action": "output",
      "id": "3",
      "inputs": [
        {
          "step": "2"
        }
      ]
    }
  ]
}]
```

To add a new pipeline you need to add a new object to the array.

## Properties:
  - id
  - name
  - input
  - output
  - steps
> id: A unique id for the pipeline no spaces allowed.
>
> name: The name of the pipeline no spaces allowed.
>
> trigger: The trigger the pipeline will use.
> > - call: when the user explicitly calls the pipeline using `#pipeline_name`
> > - with __extension name__: when the program calls the extension it will also call the pipeline.
>
> input: The input the pipeline will use. Accessed by `input` in the steps.
> > - clipboard
> > - search
>
> output: The output the pipeline will use.
> > - clipboard
> > - answer
> > - search
> > - null
>
> steps: An array of instructions.
> > action: The action to perform.
> > > - _extension name_: the name of the extension to call.
> > > - join: joins static text or step outputs
> > > - bash: runs the input as a terminal command
> > > - output
> >
> > id: the id of the step no spaces allowed.
> >
 > > inputs: An array of inputs.
> > > step: The step id to use, or `"input"` to use the pipeline's input source.

# Examples
### join
```json
{
  "id": "my_joining_step",
  "action": "join",
  "inputs": [
    "Static text",
    {"step": "previous_step"},
    {"step": "another_step"},
    "More static text"
  ]
}
```
### bash
```json
{
  "id": "my_bash_step",
  "action": "bash",
  "inputs": [
    {"step": "previous_step"}
  ]
}
```
### output
```json
{
  "id": "my_output_step",
  "action": "output",
  "inputs": [
    {"step": "previous_step"}
  ]
}
```
### call
```json
{
  "id": "my_call_step",
  "action": "extension_name",
  "inputs": [
    {"step": "previous_step"}
  ]
}
```