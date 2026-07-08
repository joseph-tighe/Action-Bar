# Pipelines

> Note: Pipelines are still in development.
> 
> A GUI for pipelines is being worked on, and may make this documentation irrelevant.

Pipelines are a way to call multiple extensions together.

A pipeline is a JSON file that looks like this:
```json
[{
  "id": "My_Pipeline",
  "name": "My_Pipeline",
  "input": "search",
  "output": "answer",
  "steps": [
    {
      "action": "call",
      "id": "one",
      "inputs": [
        {
          "step": "one",
          "input": "clipboard"
        }
      ],
    },
    {
      "action": "bash",
      "id": "2",
      "inputs": [
        {
          "step": "one",
          "input": "clipboard"
        }
      ],
    },
    {
      "action": "call",
      "id": "3",
      "inputs": [
        {
          "step": "2",
          "input": "clipboard"
        }
      ],
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
> > - with __extension name__
>
> input: The input the pipeline will use.
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
> > > - bash: runs a terminal command
> > > - output
> >
> > id: the id of the step no spaces allowed.
> >
> > inputs: An array of inputs.
> > > step: The step to use.
> > >
> > > input: The input to use.
