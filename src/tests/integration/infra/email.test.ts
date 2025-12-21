import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.ts", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "Clone-Tabnews <contact@clone-tabnews.com.br>",
      to: "contact@clone-tabnews.com.br",
      subject: "First Email",
      text: "First Email",
    });
    await email.send({
      from: "Clone-Tabnews <contact@clone-tabnews.com.br>",
      to: "contact@clone-tabnews.com.br",
      subject: "Last Email",
      text: "Body test",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contact@clone-tabnews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<contact@clone-tabnews.com.br>");
    expect(lastEmail.subject).toBe("Last Email");
    expect(lastEmail.text).toBe("Body test\n");
  });
});
