// Purpose: Deploy the project to the EC2 instance
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import { readEC2MetaData, getInstanceChoices } from "../utils/instanceData.js";
import SSHClient from "../models/sshClient.js";
const COMMAND_HEADER_MSG = "Pinniped Start";

const start = async () => {
  ui.commandHeader(COMMAND_HEADER_MSG);

  let answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message:
        "This command will start your deployed application using pm2 process manager\n" +
        "  on your provisioned EC2 instance, and will allow you to enter a domain\n" +
        "  for setting up HTTPS access to your application.\n\n" +
        "  Would you like to proceed?",
    },
  ]);

  if (!answers.proceed) {
    console.log(
      "\n  Start command cancelled. \n  Please run `pinniped info` help using this cli.\n"
    );
    return;
  }
  const EC2MetaData = await readEC2MetaData();
  const instanceChoices = await getInstanceChoices();

  answers = await inquirer.prompt([
    {
      type: "list",
      name: "instance",
      message: "Select the EC2 instance to start: \n\n",
      choices: instanceChoices,
    },
  ]);

  try {
    //start a loading spinner
    const spinner = ui.runSpinner(
      ui.colorStandard(
        `Connecting to AWS EC2 instance. This may take a few seconds...`
      )
    );

    const sshClient = new SSHClient(EC2MetaData[answers.instance], spinner);

    await sshClient.connect();

    await sshClient.runCommand("start");

    sshClient.closeConnection();

    spinner.succeed(ui.colorSuccess("Project Started Successfully!"));

    ui.space();
    ui.print("Run `pinniped stop` to stop your server on the EC2 instance");
    ui.space();
  } catch (err) {
    console.log(err);
  }
};

export default start;
