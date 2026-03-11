import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, MapPin, Cpu } from "lucide-react";

interface Props {
  companySize: string | null;
  companyIndustry: string | null;
  companyRevenue: string | null;
  companyLocation: string | null;
  companyTechStack: string[] | null;
  companyWebsite: string | null;
  linkedinUrl: string | null;
}

export function EnrichmentCard({
  companySize,
  companyIndustry,
  companyRevenue,
  companyLocation,
  companyTechStack,
  companyWebsite,
  linkedinUrl,
}: Props) {
  const hasData = companySize || companyIndustry || companyRevenue || companyLocation || companyWebsite;
  if (!hasData) return null;

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <Building2 className="h-4 w-4" />
          Company Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {companyIndustry && (
            <div>
              <p className="text-xs text-zinc-500">Industry</p>
              <p className="text-sm text-zinc-50">{companyIndustry}</p>
            </div>
          )}
          {companySize && (
            <div>
              <p className="text-xs text-zinc-500">Company Size</p>
              <p className="text-sm text-zinc-50">{companySize}</p>
            </div>
          )}
          {companyRevenue && (
            <div>
              <p className="text-xs text-zinc-500">Revenue</p>
              <p className="text-sm text-zinc-50">{companyRevenue}</p>
            </div>
          )}
          {companyLocation && (
            <div>
              <p className="flex items-center gap-1 text-xs text-zinc-500">
                <MapPin className="h-3 w-3" /> Location
              </p>
              <p className="text-sm text-zinc-50">{companyLocation}</p>
            </div>
          )}
          {companyWebsite && (
            <div>
              <p className="flex items-center gap-1 text-xs text-zinc-500">
                <Globe className="h-3 w-3" /> Website
              </p>
              <a
                href={companyWebsite.startsWith("http") ? companyWebsite : `https://${companyWebsite}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-400 hover:underline"
              >
                {companyWebsite}
              </a>
            </div>
          )}
          {linkedinUrl && (
            <div>
              <p className="text-xs text-zinc-500">LinkedIn</p>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-400 hover:underline"
              >
                Profile
              </a>
            </div>
          )}
        </div>
        {companyTechStack && companyTechStack.length > 0 && (
          <div className="mt-4">
            <p className="flex items-center gap-1 text-xs text-zinc-500">
              <Cpu className="h-3 w-3" /> Tech Stack
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {companyTechStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
