exports.handler = async (event: any) => {
  const records = event.Records.map((record: { body: string }) => record.body);

  console.log(records, "records");
};
