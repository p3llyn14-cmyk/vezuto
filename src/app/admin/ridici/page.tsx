import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDictionary } from "@/i18n";
import {
  reviewDocumentAction,
  suspendUserAction,
  verifyDriverAction,
} from "@/modules/admin/actions";
import { listDriversForReview } from "@/modules/admin/queries";

export const metadata: Metadata = { title: "Admin — řidiči — VezuTo" };

export default async function AdminDriversPage() {
  const dict = getDictionary().admin;
  const drivers = await listDriversForReview();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.driversTitle}</h1>

      <div className="space-y-4">
        {drivers.map((driver) => (
          <Card key={driver.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <CardTitle className="text-base">
                {driver.profile
                  ? `${driver.profile.first_name} ${driver.profile.last_name}`
                  : "—"}
              </CardTitle>
              <Badge variant="secondary">
                {dict.verificationStatus[driver.verification_status]}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{driver.profile?.email}</p>

              <div className="flex gap-2">
                <form
                  action={async () => {
                    "use server";
                    await verifyDriverAction(driver.id, "verified");
                  }}
                >
                  <Button type="submit" size="sm" variant="outline">
                    {dict.approve}
                  </Button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await verifyDriverAction(driver.id, "rejected");
                  }}
                >
                  <Button type="submit" size="sm" variant="outline">
                    {dict.reject}
                  </Button>
                </form>
                {driver.profile &&
                  (() => {
                    const profileId = driver.profile.id;
                    return (
                      <form
                        action={async () => {
                          "use server";
                          await suspendUserAction(profileId);
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          {dict.suspendUser}
                        </Button>
                      </form>
                    );
                  })()}
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">{dict.documents}</h3>
                {driver.documents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{dict.noDocuments}</p>
                ) : (
                  <ul className="space-y-2">
                    {driver.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{doc.document_type}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {dict.verificationStatus[doc.verification_status]}
                          </Badge>
                          {doc.verification_status === "pending" && (
                            <>
                              <form
                                action={async () => {
                                  "use server";
                                  await reviewDocumentAction(doc.id, "verified");
                                }}
                              >
                                <Button type="submit" size="xs" variant="ghost">
                                  {dict.approve}
                                </Button>
                              </form>
                              <form
                                action={async () => {
                                  "use server";
                                  await reviewDocumentAction(doc.id, "rejected");
                                }}
                              >
                                <Button type="submit" size="xs" variant="ghost">
                                  {dict.reject}
                                </Button>
                              </form>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {drivers.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">Žádní řidiči.</p>
        )}
      </div>
    </div>
  );
}
